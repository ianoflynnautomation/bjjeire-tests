import { readFileSync } from 'node:fs';
import { ConfigError } from '@shared/config/config-errors';
import { z } from 'zod';
import type { CampaignId, ExecutionTargetSpec, IterationId, TestSelection, TestSuiteId } from '../application/ports';
import type { FolderPlacement } from '../domain/folder-placement';
import {
  CLI_PREFIX,
  cliFlagOf,
  ENV_PREFIX,
  envNameOf,
  FILE_ONLY_KEYS,
  RUNNER_ENV_VARS,
  SECRET_ENV_VARS,
  SETTING_KEYS,
  SquashMode,
  squashSettingsSchema,
  type SettingKey,
  type SquashSettings,
} from './config-schema';
import { LogLevel } from './logger';
import { applySquashEnv, readSquashEnvFiles } from './squash-env.mts';

export type RetryPolicy = Readonly<{
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
}>;

export type SquashConnection = Readonly<{
  baseUrl: string;
  /** A Squash personal API token, sent as a Bearer token. */
  token: string;
  projectId: number;
  timeoutMs: number;
  retry: RetryPolicy;
}>;

export type SquashConfig = Readonly<{
  mode: typeof SquashMode.DryRun | typeof SquashMode.Publish;
  tag: string;
  failOnError: boolean;
  logLevel: LogLevel;
  /** Present whenever a setting needs Squash: publish mode, or a folder/suite selection. */
  connection: SquashConnection | undefined;
  placement: FolderPlacement;
  target: ExecutionTargetSpec | undefined;
  /** A release creates a new execution. An ordinary publish updates the test case execution. */
  release: boolean;
  selection: TestSelection | undefined;
  /** Which source set each setting, for `SQUASH_TM_LOG_LEVEL=debug`. */
  provenance: ReadonlyMap<SettingKey, string>;
}>;

/** Where configuration comes from; injected so the cascade is testable without touching `process.env`. */
export type ConfigSources = Readonly<{
  env: Readonly<Record<string, string | undefined>>;
  /** File contents, or `undefined` when the file does not exist. */
  readFile: (path: string) => string | undefined;
}>;

const DEFAULT_CONFIG_FILE = 'squash-config.json';
const DEFAULT_RETRY_DELAYS = { baseDelayMs: 500, maxDelayMs: 10_000 } as const;

/** The lowest layer of the cascade; every later layer overrides key by key. */
const DEFAULTS = {
  mode: SquashMode.DryRun,
  /** Opt-in: a test is a Squash test case only when it (or its describe) carries this tag. */
  tag: '@squash',
  failOnError: false,
  logLevel: LogLevel.Info,
  timeoutMs: 30_000,
  maxAttempts: 5,
  release: false,
  folderRules: [],
} as const satisfies SquashSettings;

type Defaulted = SquashSettings & { [K in keyof typeof DEFAULTS]-?: NonNullable<SquashSettings[K]> };

type Layer = Readonly<{ source: string; settings: SquashSettings }>;

/**
 * Cascades the configuration sources (defaults < config file < its section for
 * the active project < environment < CLI), validates each against the one
 * schema, and resolves the result into a `SquashConfig`. Every error names the
 * source that caused it.
 */
export class SquashConfigLoader {
  constructor(private readonly sources: ConfigSources) {}

  /** @throws {ConfigError} naming the source of any invalid, unknown, secret or conflicting setting. */
  load(): SquashConfig {
    const file = this.fromFile();
    const env = this.fromEnv();
    const cli = this.fromCli();
    // The project can come from any source, and picks the file's project section.
    const projectId = cli?.settings.projectId ?? env.settings.projectId ?? file?.settings.projectId;
    const layers = [
      { source: 'default', settings: DEFAULTS },
      file,
      file && projectId !== undefined ? projectSection(file, projectId) : undefined,
      env,
      cli,
    ].filter(layer => layer !== undefined);
    const provenance = new Map<SettingKey, string>();
    let settings: Defaulted = DEFAULTS;
    for (const layer of layers) {
      const defined = Object.entries(layer.settings).filter(([, value]) => value !== undefined);
      // Only defined values are spread, so every defaulted key stays defined.
      settings = { ...settings, ...Object.fromEntries(defined) };
      for (const [key] of defined) provenance.set(key as SettingKey, layer.source);
    }
    return this.resolve(settings, provenance);
  }

  private fromEnv(): Layer {
    const known = new Map(SETTING_KEYS.map(key => [envNameOf(key), key]));
    const ignored = new Set<string>([...SECRET_ENV_VARS, ...RUNNER_ENV_VARS]);
    const raw: Record<string, string> = {};
    for (const [name, value] of Object.entries(this.sources.env)) {
      if (!name.startsWith(ENV_PREFIX) || ignored.has(name) || value === undefined || value.trim() === '') continue;
      if (RETIRED_ENV_VARS.has(name)) throw new ConfigError(`${name}: ${BASIC_AUTH_UNSUPPORTED}`);
      const key = known.get(name);
      if (key === undefined) throw new ConfigError(`Unknown env var ${name}. Known: ${[...known.keys()].join(', ')}.`);
      if (FILE_ONLY_KEYS.has(key)) throw new ConfigError(`${name}: '${key}' can only be set in the config file.`);
      raw[key] = value.trim();
    }
    return { source: 'environment', settings: parseSettings(raw, 'environment') };
  }

  private fromFile(): Layer | undefined {
    const explicit = nonBlank(this.sources.env['SQUASH_TM_CONFIG']);
    const path = explicit ?? DEFAULT_CONFIG_FILE;
    const text = this.sources.readFile(path);
    if (text === undefined) {
      if (explicit !== undefined) throw new ConfigError(`Squash config file ${path} does not exist.`);
      return undefined;
    }
    const source = `config file ${path}`;
    const raw = parseJson(text, source);
    rejectSecrets(raw, source, key => `"${key}"`);
    return { source, settings: parseSettings(raw, source) };
  }

  /** `squash:run` passes its `--squash-*` flags as a JSON object of strings in SQUASH_TM_CLI. */
  private fromCli(): Layer | undefined {
    const json = nonBlank(this.sources.env['SQUASH_TM_CLI']);
    if (json === undefined) return undefined;
    const raw = parseJson(json, 'CLI');
    rejectSecrets(raw, 'CLI', key => `${CLI_PREFIX}${key}`);
    const fileOnly = SETTING_KEYS.find(key => FILE_ONLY_KEYS.has(key) && isObject(raw) && key in raw);
    if (fileOnly !== undefined) throw new ConfigError(`${cliFlagOf(fileOnly)}: can only be set in the config file.`);
    return { source: 'CLI', settings: parseSettings(raw, 'CLI') };
  }

  private resolve(settings: Defaulted, provenance: ReadonlyMap<SettingKey, string>): SquashConfig {
    const mode = settings.mode === SquashMode.Auto ? this.ciMode() : settings.mode;
    // Conflicting settings are the root mistake; report them before what they would need.
    const target = targetOf(settings, provenance);
    const selection = selectionOf(settings, provenance);
    const needsConnection = mode === SquashMode.Publish || selection !== undefined;
    return {
      mode,
      tag: settings.tag,
      failOnError: settings.failOnError,
      logLevel: settings.logLevel,
      connection: needsConnection ? this.connectionOf(settings, mode) : undefined,
      placement: { defaultFolder: settings.testCaseFolder, rules: settings.folderRules },
      target,
      release: settings.release,
      selection,
      provenance,
    };
  }

  private ciMode(): SquashConfig['mode'] {
    const ci = nonBlank(this.sources.env['CI'])?.toLowerCase();
    return ci === 'true' || ci === '1' ? SquashMode.Publish : SquashMode.DryRun;
  }

  private connectionOf(settings: Defaulted, mode: SquashConfig['mode']): SquashConnection {
    const why = mode === SquashMode.Publish ? 'publish mode' : 'a folder or test suite selection';
    const { url, projectId } = settings;
    if (url === undefined || projectId === undefined) {
      const missing = (['url', 'projectId'] as const).filter(key => settings[key] === undefined);
      throw new ConfigError(
        `${why} needs ${missing.map(key => `${key} (${envNameOf(key)} or ${cliFlagOf(key)})`).join(', ')}.`,
      );
    }
    return {
      baseUrl: url,
      projectId,
      token: this.tokenOf(why),
      timeoutMs: settings.timeoutMs,
      retry: { ...DEFAULT_RETRY_DELAYS, maxAttempts: settings.maxAttempts },
    };
  }

  private tokenOf(why: string): string {
    const token = nonBlank(this.sources.env['SQUASH_TM_TOKEN']);
    if (token !== undefined) return token;
    throw new ConfigError(
      `${why} needs SQUASH_TM_TOKEN in the environment: a Squash personal API token ` +
        '(My account › Personal API tokens, read-write).',
    );
  }
}

/**
 * Reads the real process environment and the working directory. `SQUASH_TM_*`
 * missing from the shell are filled from `.env` and `.env*.local` first.
 */
export function loadSquashConfig(): SquashConfig {
  const profile = (process.env['APP_ENV'] ?? 'local').toLowerCase();
  applySquashEnv(process.env, readSquashEnvFiles(process.cwd(), profile));
  return new SquashConfigLoader({ env: process.env, readFile: readFileIfPresent }).load();
}

/** The file's `projects.<id>` section as a layer of its own, so provenance can name it. */
function projectSection(file: Layer, projectId: number): Layer | undefined {
  const section = file.settings.projects?.[String(projectId)];
  return section ? { source: `${file.source} › projects.${projectId}`, settings: section } : undefined;
}

function readFileIfPresent(path: string): string | undefined {
  try {
    return readFileSync(path, 'utf8');
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return undefined;
    throw error;
  }
}

function nonBlank(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed === '' ? undefined : trimmed;
}

function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null;
}

function parseJson(text: string, source: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    throw new ConfigError(`${source} is not valid JSON.`, { cause: error });
  }
}

function parseSettings(raw: unknown, source: string): SquashSettings {
  const parsed = squashSettingsSchema.safeParse(raw);
  if (!parsed.success)
    throw new ConfigError(`Invalid Squash settings from ${source}:\n${z.prettifyError(parsed.error)}`);
  return parsed.data;
}

const SECRET_KEYS = ['token', 'username', 'password'] as const;

/** Basic auth is not supported: enterprise instances behind SSO only accept API tokens. */
const RETIRED_ENV_VARS: ReadonlySet<string> = new Set(['SQUASH_TM_USERNAME', 'SQUASH_TM_PASSWORD']);
const BASIC_AUTH_UNSUPPORTED =
  'username/password auth is not supported; unset it and set SQUASH_TM_TOKEN to a Squash personal API token.';

function rejectSecrets(raw: unknown, source: string, label: (key: string) => string): void {
  const secret = SECRET_KEYS.find(key => isObject(raw) && key in raw);
  if (secret === undefined) return;
  throw new ConfigError(
    `${source}: ${label(secret)} is a credential; set SQUASH_TM_${secret.toUpperCase()} in the environment ` +
      '(a CI secret) instead, so it never lands in a committed file or a process list.',
  );
}

function conflict(
  provenance: ReadonlyMap<SettingKey, string>,
  keys: readonly SettingKey[],
  reason: string,
): ConfigError {
  const where = keys.map(key => `${key} (from ${provenance.get(key) ?? 'default'})`).join(' and ');
  return new ConfigError(`${where} cannot be combined: ${reason}.`);
}

function targetOf(
  settings: SquashSettings,
  provenance: ReadonlyMap<SettingKey, string>,
): ExecutionTargetSpec | undefined {
  const { testSuiteId, iterationId, campaignId, campaign, iteration } = settings;
  const alsoSet = (keys: readonly SettingKey[]): SettingKey[] => keys.filter(key => settings[key] !== undefined);
  if (testSuiteId !== undefined) {
    const extra = alsoSet(['iterationId', 'campaignId', 'campaign', 'iteration']);
    if (extra.length > 0)
      throw conflict(provenance, ['testSuiteId', ...extra], 'a test suite already determines its iteration');
    return { kind: 'test-suite', testSuiteId: testSuiteId as TestSuiteId };
  }
  if (iterationId !== undefined) {
    const extra = alsoSet(['campaignId', 'campaign', 'iteration']);
    if (extra.length > 0)
      throw conflict(provenance, ['iterationId', ...extra], 'an iteration id already names the run');
    return { kind: 'iteration', iterationId: iterationId as IterationId };
  }
  if (campaignId !== undefined && campaign !== undefined) {
    throw conflict(provenance, ['campaignId', 'campaign'], 'name the campaign one way');
  }
  if (campaignId !== undefined) return { kind: 'campaign', campaign: { id: campaignId as CampaignId }, iteration };
  if (campaign !== undefined) return { kind: 'campaign', campaign: { path: campaign }, iteration };
  if (iteration !== undefined)
    throw new ConfigError(`iteration "${iteration}" needs a campaign or campaignId to live in.`);
  return undefined;
}

function selectionOf(settings: SquashSettings, provenance: ReadonlyMap<SettingKey, string>): TestSelection | undefined {
  const { testSuiteId, filterFolder } = settings;
  if (testSuiteId !== undefined && filterFolder !== undefined) {
    throw conflict(provenance, ['testSuiteId', 'filterFolder'], 'select tests by suite or by folder, not both');
  }
  if (testSuiteId !== undefined) return { testSuiteId: testSuiteId as TestSuiteId };
  return filterFolder === undefined ? undefined : { folder: filterFolder };
}

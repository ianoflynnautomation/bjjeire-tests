import { z } from 'zod';
import { LogLevel } from './logger';

/**
 * The one schema every configuration source is validated against. Keys are
 * flat so the three sources map onto it mechanically, with no per-key tables:
 *
 *   squash-config.json   "campaign": "Releases/2.4"
 *   environment          SQUASH_TM_CAMPAIGN="Releases/2.4"
 *   CLI (squash:run)     --squash-campaign="Releases/2.4"
 *
 * Precedence, lowest to highest: defaults < config file < the file's section for
 * the active project < environment < CLI. The committed file holds shared,
 * reviewed defaults; the environment adjusts one deployment or pipeline run;
 * a CLI flag adjusts one local run (the usual twelve-factor order).
 * Credentials are not settings: they come only from the environment (see
 * SECRET_ENV_VARS), so they never land in a committed file or a process list.
 */

export const SquashMode = {
  DryRun: 'dry-run',
  Publish: 'publish',
  /** `publish` when `CI` is set, `dry-run` otherwise. */
  Auto: 'auto',
} as const;

export type SquashMode = (typeof SquashMode)[keyof typeof SquashMode];

const positiveInt = z.coerce.number().int().positive();

/** Env and CLI values are strings; the file may hold real booleans. */
const BOOLEAN_WORDS: Readonly<Record<string, boolean>> = {
  true: true,
  false: false,
  1: true,
  0: false,
  yes: true,
  no: false,
};
const booleanish = z.preprocess(
  value => (typeof value === 'string' ? (BOOLEAN_WORDS[value.trim().toLowerCase()] ?? value) : value),
  z.boolean(),
);

/** A Squash folder path such as `Acceptance/Gyms`; slashes at either end and blank segments are dropped. */
const folderPath = z
  .string()
  .transform(path =>
    path
      .split('/')
      .map(segment => segment.trim())
      .filter(segment => segment.length > 0)
      .join('/'),
  )
  .pipe(z.string().min(1, 'must name at least one folder'));

/**
 * Where synced test cases are created. The first rule whose `path` prefix and
 * `tag` (each optional, at least one required) match a test wins.
 */
const folderRuleSchema = z
  .object({
    /** Spec path prefix relative to the test dir: `features/gyms/`. */
    path: z.string().min(1).optional(),
    /** A tag the test must carry: `@api`. */
    tag: z.string().startsWith('@').optional(),
    folder: folderPath,
  })
  .strict()
  .refine(rule => rule.path !== undefined || rule.tag !== undefined, 'a folder rule needs a path, a tag, or both');

/** What a project section of the config file may set: where that project's synced test cases go. */
const placementSettingsSchema = z
  .object({
    /** Folder for new test cases no rule matches; the project root when unset. */
    testCaseFolder: folderPath,
    folderRules: z.array(folderRuleSchema),
  })
  .partial()
  .strict();

export const squashSettingsSchema = z
  .object({
    mode: z.enum(Object.values(SquashMode)),
    /** Squash TM root including the context path: `http://localhost:8080/squash`. */
    url: z.url(),
    projectId: positiveInt,
    /** Only tests carrying this tag are Squash test cases. */
    tag: z.string().startsWith('@'),
    failOnError: booleanish,
    logLevel: z.enum(Object.values(LogLevel)),
    timeoutMs: positiveInt,
    maxAttempts: positiveInt,

    /** Folder for new test cases no rule matches; the project root when unset. */
    testCaseFolder: folderPath,
    folderRules: z.array(folderRuleSchema),
    /**
     * Config file only: placement per Squash project, keyed by project id, for
     * teams sharing one file: `"projects": { "12": { "testCaseFolder": "Gyms" } }`.
     * The section for the active projectId overrides the file's top level.
     */
    projects: z
      .record(z.string(), placementSettingsSchema)
      // A record's key schema loses its message in Zod 4, so the keys are checked here.
      .refine(projects => Object.keys(projects).every(key => /^[1-9]\d*$/.test(key)), {
        message: 'project keys are Squash project ids, such as "12"',
      }),

    /** Campaign path, folders included: `Releases/2.4/Regression`. Created when missing. */
    campaign: folderPath,
    campaignId: positiveInt,
    /** Iteration name inside the campaign. Created when missing; a new one per run when unset. */
    iteration: z.string().trim().min(1),
    iterationId: positiveInt,
    /**
     * Creates a release execution as well as updating the test case execution.
     * Ordinary publishes update the test case execution only.
     */
    release: booleanish,
    /** Run only this Squash test suite's test cases, and publish into its iteration. */
    testSuiteId: positiveInt,

    /** Run only tests whose Squash test case sits in this folder (or below it). */
    filterFolder: folderPath,
  })
  .partial()
  .strict();

export type SquashSettings = z.infer<typeof squashSettingsSchema>;
export type SettingKey = keyof SquashSettings;

export const SETTING_KEYS = Object.keys(squashSettingsSchema.shape) as readonly SettingKey[];

/** Structured settings: expressible in the config file only. */
export const FILE_ONLY_KEYS: ReadonlySet<SettingKey> = new Set(['folderRules', 'projects']);

export const ENV_PREFIX = 'SQUASH_TM_';
export const CLI_PREFIX = '--squash-';

/** Credentials and runner plumbing: read from the environment, never treated as settings. */
export const SECRET_ENV_VARS = ['SQUASH_TM_TOKEN'] as const;
/** Set by the squash:run CLI: `SQUASH_TM_CLI` carries its `--squash-*` overrides as JSON. */
export const RUNNER_ENV_VARS = [
  'SQUASH_TM_CONFIG',
  'SQUASH_TM_CLI',
  'SQUASH_TM_RUNNER',
  'SQUASH_TM_TEST_LIST',
] as const;

/** `campaignId` → `SQUASH_TM_CAMPAIGN_ID`. */
export function envNameOf(key: SettingKey): string {
  return `${ENV_PREFIX}${key.replace(/[A-Z]/g, letter => `_${letter}`).toUpperCase()}`;
}

/** `campaignId` → `--squash-campaign-id`. */
export function cliFlagOf(key: SettingKey): string {
  return `${CLI_PREFIX}${key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`;
}

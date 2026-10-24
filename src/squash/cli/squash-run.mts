/**
 * npm run squash:run -- [--squash-<setting>=<value> ...] [playwright test arguments ...]
 *
 * Runs Playwright with Squash TM settings given on the command line, the
 * highest-precedence layer of the cascade (defaults < squash-config.json <
 * environment < CLI). Every `--squash-*` flag is a setting in kebab
 * case (`--squash-campaign-id 7` sets `campaignId`); `--squash-config <path>`
 * picks the config file. Everything else is passed to `playwright test`.
 *
 *   npm run squash:run -- --squash-mode=publish --squash-campaign="Releases/2.4" \
 *     --squash-iteration="Nightly #128" --squash-filter-folder=Playwright/Features/Gyms -g @smoke
 *
 * Two phases: `playwright test --list` with the select reporter turns a folder
 * or test suite selection into a test-list file, then `playwright test` runs
 * it (unfiltered when no selection is configured). Settings reach the
 * reporters through SQUASH_TM_CLI; validation happens there, against the one
 * schema, so this script only splits arguments.
 *
 * Plain Node (type stripping, no imports from src): it must run before
 * Playwright's TypeScript loader is involved.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';

const FLAG_PREFIX = '--squash-';
const SELECT_REPORTER = './src/squash/reporters/squash-select.reporter.ts';
const RESULTS_REPORTER = './src/squash/reporters/squash-results.reporter.ts';
/** Not under test-results/: Playwright empties that folder when a run starts, before it reads the list. */
const TEST_LIST = 'playwright/.cache/squash-test-list.txt';

type Parsed = { overrides: Record<string, string>; configPath: string | undefined; playwrightArgs: string[] };

function camelCase(kebab: string): string {
  return kebab.replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase());
}

function parseArgs(argv: readonly string[]): Parsed {
  const parsed: Parsed = { overrides: {}, configPath: undefined, playwrightArgs: [] };
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index] ?? '';
    if (!arg.startsWith(FLAG_PREFIX)) {
      parsed.playwrightArgs.push(arg);
      continue;
    }
    const [flag = '', ...inline] = arg.split('=');
    const value = inline.length > 0 ? inline.join('=') : argv[++index];
    if (value === undefined) throw new Error(`${flag} needs a value: ${flag}=<value>`);
    const key = camelCase(flag.slice(FLAG_PREFIX.length));
    if (key === 'config') parsed.configPath = value;
    else parsed.overrides[key] = value;
  }
  return parsed;
}

/**
 * A `--reporter` flag replaces every configured reporter, the Squash one
 * included, so keep it in the list. Without the flag the config adds it.
 */
function keepResultsReporter(args: readonly string[]): string[] {
  return args.map((arg, index) => {
    if (arg.startsWith('--reporter=')) return `${arg},${RESULTS_REPORTER}`;
    return args[index - 1] === '--reporter' ? `${arg},${RESULTS_REPORTER}` : arg;
  });
}

/** The selection phase needs the select reporter alone; Playwright honours the last `--reporter`. */
function withoutReporter(args: readonly string[]): string[] {
  return args.filter((arg, index) => !arg.startsWith('--reporter') && args[index - 1] !== '--reporter');
}

function playwright(args: readonly string[], env: NodeJS.ProcessEnv): number {
  const result = spawnSync('npx', ['playwright', 'test', ...args], { stdio: 'inherit', env });
  return result.status ?? 1;
}

function main(): number {
  const { overrides, configPath, playwrightArgs } = parseArgs(process.argv.slice(2));
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    SQUASH_TM_RUNNER: '1',
    SQUASH_TM_CLI: JSON.stringify(overrides),
    SQUASH_TM_TEST_LIST: TEST_LIST,
    ...(configPath === undefined ? {} : { SQUASH_TM_CONFIG: configPath }),
  };

  rmSync(TEST_LIST, { force: true });
  const selected = playwright(['--list', `--reporter=${SELECT_REPORTER}`, ...withoutReporter(playwrightArgs)], env);
  if (selected !== 0) return selected;

  const testList = existsSync(TEST_LIST) ? [`--test-list=${TEST_LIST}`] : [];
  return playwright([...keepResultsReporter(playwrightArgs), ...testList], env);
}

try {
  process.exitCode = main();
} catch (error) {
  process.stderr.write(`[squash-tm] ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}

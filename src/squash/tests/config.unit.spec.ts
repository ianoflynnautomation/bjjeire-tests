import { expect, test } from '@playwright/test';
import { SquashConfigLoader, type SquashConfig } from '../infrastructure/config';

const CONNECTION_ENV = {
  SQUASH_TM_URL: 'http://localhost:8080/squash',
  SQUASH_TM_PROJECT_ID: '2',
  SQUASH_TM_TOKEN: 'api-token',
};
const PROJECT_ID = 2;
const SUITE_ID = 12;

type Sources = Readonly<{
  env?: Readonly<Record<string, string>>;
  file?: unknown;
  cli?: Readonly<Record<string, string>>;
}>;

/** Loads with an in-memory environment, an optional squash-config.json and optional --squash-* flags. */
function load({ env = {}, file, cli }: Sources = {}): SquashConfig {
  return new SquashConfigLoader({
    env: { ...env, ...(cli ? { SQUASH_TM_CLI: JSON.stringify(cli) } : {}) },
    readFile: path => (path === 'squash-config.json' && file !== undefined ? JSON.stringify(file) : undefined),
  }).load();
}

test.describe('SquashConfigLoader', { tag: ['@unit'] }, () => {
  test('defaults to dry-run with no connection, no target and no selection', () => {
    expect(load()).toMatchObject({
      mode: 'dry-run',
      tag: '@squash',
      failOnError: false,
      connection: undefined,
      target: undefined,
      selection: undefined,
    });
  });

  test('layers sources: config file < environment < CLI, and records which source won', () => {
    const config = load({
      env: {
        ...CONNECTION_ENV,
        SQUASH_TM_MODE: 'publish',
        SQUASH_TM_CAMPAIGN: 'From env',
        SQUASH_TM_ITERATION: 'Env run',
      },
      file: { campaign: 'From file', iteration: 'File run', tag: '@smoke' },
      cli: { campaign: 'From CLI' },
    });

    // The environment beats the committed file; a CLI flag beats both.
    expect(config.target).toEqual({ kind: 'campaign', campaign: { path: 'From CLI' }, iteration: 'Env run' });
    expect(config.tag).toBe('@smoke');
    expect(Object.fromEntries(config.provenance)).toMatchObject({
      campaign: 'CLI',
      tag: 'config file squash-config.json',
      iteration: 'environment',
      failOnError: 'default',
    });
  });

  test('coerces env and CLI strings, and normalises folder paths', () => {
    const config = load({
      env: { ...CONNECTION_ENV, SQUASH_TM_MODE: 'publish', SQUASH_TM_FAIL_ON_ERROR: 'yes' },
      cli: { campaign: ' /Releases//2.4/ ' },
    });

    expect(config).toMatchObject({ failOnError: true, connection: { projectId: PROJECT_ID } });
    expect(config.target).toMatchObject({ campaign: { path: 'Releases/2.4' } });
  });

  test('reads folder rules from the config file only', () => {
    const rules = [{ path: 'features/gyms/', folder: 'Playwright/Features/Gyms/' }];

    expect(load({ file: { folderRules: rules } }).placement.rules).toEqual([
      { path: 'features/gyms/', folder: 'Playwright/Features/Gyms' },
    ]);
    expect(() => load({ env: { SQUASH_TM_FOLDER_RULES: '[]' } })).toThrow(/can only be set in the config file/);
    expect(() => load({ file: { folderRules: [{ folder: 'X' }] } })).toThrow(/needs a path, a tag, or both/);
  });

  test('takes the API token from the environment only, never from the file or a CLI flag', () => {
    const publish = { ...CONNECTION_ENV, SQUASH_TM_MODE: 'publish', SQUASH_TM_TOKEN: 'secret' };

    expect(load({ env: publish }).connection?.token).toBe('secret');
    expect(() => load({ file: { token: 'secret' } })).toThrow(/"token" is a credential; set SQUASH_TM_TOKEN/);
    expect(() => load({ cli: { password: 'secret' } })).toThrow(/--squash-password is a credential/);
  });

  test('accepts only an API token: no token, or username/password, is an error', () => {
    const publish = {
      SQUASH_TM_URL: CONNECTION_ENV.SQUASH_TM_URL,
      SQUASH_TM_PROJECT_ID: '2',
      SQUASH_TM_MODE: 'publish',
    };

    expect(() => load({ env: publish })).toThrow(/needs SQUASH_TM_TOKEN/);
    expect(() => load({ env: { ...CONNECTION_ENV, SQUASH_TM_USERNAME: 'admin' } })).toThrow(
      /SQUASH_TM_USERNAME: username\/password auth is not supported/,
    );
  });

  test('rejects a misspelt SQUASH_TM_* variable instead of ignoring it', () => {
    expect(() => load({ env: { SQUASH_TM_CAMPAIGN_NAME: 'x' } })).toThrow(/Unknown env var SQUASH_TM_CAMPAIGN_NAME/);
  });

  test('names the sources of settings that cannot be combined', () => {
    expect(() => load({ env: { SQUASH_TM_TEST_SUITE_ID: '12' }, cli: { campaign: 'Releases/2.4' } })).toThrow(
      'testSuiteId (from environment) and campaign (from CLI) cannot be combined: a test suite already determines its iteration.',
    );
    expect(() => load({ cli: { iteration: 'Nightly' } })).toThrow(/needs a campaign or campaignId/);
  });

  test('requires a connection for publish mode and for any selection, naming the env var and flag', () => {
    expect(() => load({ env: { SQUASH_TM_MODE: 'publish' } })).toThrow(
      /publish mode needs url \(SQUASH_TM_URL or --squash-url\), projectId/,
    );
    expect(() => load({ cli: { filterFolder: 'Playwright/Features/Gyms' } })).toThrow(
      /a folder or test suite selection needs/,
    );
  });

  test('turns a test suite into both the selection and the publish target', () => {
    const config = load({ env: { ...CONNECTION_ENV, SQUASH_TM_TEST_SUITE_ID: String(SUITE_ID) } });

    expect(config.selection).toEqual({ testSuiteId: SUITE_ID });
    expect(config.target).toEqual({ kind: 'test-suite', testSuiteId: SUITE_ID });
  });

  test('auto mode publishes in CI and dry-runs locally', () => {
    expect(load({ env: { ...CONNECTION_ENV, SQUASH_TM_MODE: 'auto', CI: 'true' } }).mode).toBe('publish');
    expect(load({ env: { SQUASH_TM_MODE: 'auto' } }).mode).toBe('dry-run');
  });

  test('fails on an explicit config file that is missing, but not on a missing default one', () => {
    expect(() => load({ env: { SQUASH_TM_CONFIG: 'ci/squash.json' } })).toThrow(/ci\/squash.json does not exist/);
    expect(() => load({ file: { projectId: 'two' } })).toThrow(/from config file squash-config.json/);
  });

  test("applies the file's section for the active project between the file and the environment", () => {
    const file = {
      testCaseFolder: 'Playwright',
      folderRules: [{ path: 'features/', folder: 'Playwright/Features' }],
      projects: {
        '12': { testCaseFolder: 'Gyms/Playwright', folderRules: [{ tag: '@api', folder: 'Gyms/API' }] },
        '15': { testCaseFolder: 'Events/Playwright' },
      },
    };

    const gyms = load({ env: { SQUASH_TM_PROJECT_ID: '12' }, file });
    expect(gyms.placement).toEqual({ defaultFolder: 'Gyms/Playwright', rules: [{ tag: '@api', folder: 'Gyms/API' }] });
    expect(gyms.provenance.get('testCaseFolder')).toBe('config file squash-config.json › projects.12');

    const events = load({ cli: { projectId: '15' }, file });
    expect(events.placement).toEqual({
      defaultFolder: 'Events/Playwright',
      rules: [{ path: 'features/', folder: 'Playwright/Features' }],
    });

    const overridden = load({ env: { SQUASH_TM_PROJECT_ID: '12', SQUASH_TM_TEST_CASE_FOLDER: 'Hotfix' }, file });
    expect(overridden.placement.defaultFolder).toBe('Hotfix');
    expect(load({ env: { SQUASH_TM_PROJECT_ID: '99' }, file }).placement.defaultFolder).toBe('Playwright');
  });

  test('keeps project sections in the config file, keyed by real project ids', () => {
    expect(() => load({ env: { SQUASH_TM_PROJECTS: '{}' } })).toThrow(/can only be set in the config file/);
    expect(() => load({ file: { projects: { gyms: { testCaseFolder: 'Gyms' } } } })).toThrow(
      /project keys are Squash project ids/,
    );
    expect(() => load({ file: { projects: { '12': { campaign: 'Releases' } } } })).toThrow(
      /from config file squash-config.json/,
    );
  });
});

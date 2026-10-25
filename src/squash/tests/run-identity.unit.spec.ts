import { expect, test } from '@playwright/test';
import { runEnvironment, sharedCiRunId, squashRunId } from '../infrastructure/run-identity';

test.describe('Squash run identity', { tag: ['@unit'] }, () => {
  test('shares one id across shards of a CI build, and ignores a per-process local stamp', () => {
    expect(squashRunId({ TEST_RUN_ID: 'local-1710000000000', BUILD_BUILDID: '99' })).toBe('azure-99');
    expect(sharedCiRunId({ GITHUB_RUN_ID: '42' })).toBe('42-1');
    expect(sharedCiRunId({ GITHUB_RUN_ID: '42', GITHUB_RUN_ATTEMPT: '3' })).toBe('42-3');
    expect(squashRunId({ CI_PIPELINE_ID: '7', TEST_RUN_ID: 'local-1' })).toBe('gitlab-7');
    expect(squashRunId({ BUILD_TAG: 'jenkins-suite-15', TEST_RUN_ID: 'local-1' })).toBe('jenkins-suite-15');
  });

  test('keeps a run id someone set, including on GitHub', () => {
    expect(squashRunId({ TEST_RUN_ID: 'nightly-4', GITHUB_RUN_ID: '42' })).toBe('nightly-4');
    expect(squashRunId({ TEST_RUN_ID: '42-1', GITHUB_RUN_ID: '42' })).toBe('42-1');
  });

  test('names the environment from SQUASH_TM_ENVIRONMENT, then APP_ENV', () => {
    expect(runEnvironment({ SQUASH_TM_ENVIRONMENT: 'staging', APP_ENV: 'dev' })).toEqual({
      name: 'staging',
      assumedLocal: false,
    });
    expect(runEnvironment({ APP_ENV: 'dev' })).toEqual({ name: 'dev', assumedLocal: false });
    expect(runEnvironment({})).toEqual({ name: 'local', assumedLocal: true });
  });
});

import { expect, test } from '@playwright/test';
import {
  applySquashEnv,
  formatSquashEnvLoad,
  orderedSquashEnvFiles,
  parseSquashEnv,
  resolveSquashEnvProfile,
} from '../infrastructure/env-files.mts';

test.describe('squash env files', { tag: ['@unit'] }, () => {
  test('profile files come before other .env*.local files', () => {
    expect(
      orderedSquashEnvFiles(['.env.dev.local', '.env', '.env.local.example', 'README.md', '.env.local'], 'local'),
    ).toEqual(['.env.local', '.env', '.env.dev.local']);
    expect(orderedSquashEnvFiles(['.env', '.env.dev.local'], 'dev')).toEqual(['.env.dev.local', '.env']);
  });

  test('a value already in the environment wins, and other keys stay put', () => {
    const env: NodeJS.ProcessEnv = { SQUASH_TM_URL: 'http://shell/squash', BASE_URL: 'http://app' };
    applySquashEnv(env, [
      [
        '.env.dev.local',
        'SQUASH_TM_URL=http://file/squash\nSQUASH_TM_TOKEN=\nBASE_URL=https://dev.example\nSQUASH_TM_PROJECT_ID=1\n',
      ],
    ]);
    expect(env).toMatchObject({
      SQUASH_TM_URL: 'http://shell/squash',
      BASE_URL: 'http://app',
      SQUASH_TM_PROJECT_ID: '1',
    });
    expect(env['SQUASH_TM_TOKEN']).toBeUndefined();
  });

  test('the first file that sets a key wins', () => {
    const env: NodeJS.ProcessEnv = {};
    applySquashEnv(env, [
      ['.env', 'SQUASH_TM_URL=http://local/squash\n'],
      ['.env.dev.local', 'SQUASH_TM_URL=http://dev/squash\nSQUASH_TM_TOKEN="secret"\n'],
    ]);
    expect(env['SQUASH_TM_URL']).toBe('http://local/squash');
    expect(env['SQUASH_TM_TOKEN']).toBe('secret');
  });

  test('SQUASH_TM_PROFILE selects the env file, ahead of APP_ENV', () => {
    expect(resolveSquashEnvProfile({ SQUASH_TM_PROFILE: 'Acme', APP_ENV: 'staging' })).toEqual({
      profile: 'acme',
      source: 'SQUASH_TM_PROFILE',
    });
    expect(resolveSquashEnvProfile({ APP_ENV: 'dev' })).toEqual({ profile: 'dev', source: 'APP_ENV' });
    expect(resolveSquashEnvProfile({})).toEqual({ profile: 'local', source: 'default' });
  });

  test('the env-load line names files and never values', () => {
    const applied = new Map([
      ['SQUASH_TM_TOKEN', '.env.dev.local'],
      ['SQUASH_TM_URL', '.env.local'],
    ]);

    expect(formatSquashEnvLoad({ profile: 'dev', source: 'APP_ENV' }, applied)).toBe(
      'Env profile "dev" (from APP_ENV; set SQUASH_TM_PROFILE to choose the env file independently). ' +
        'SQUASH_TM_TOKEN from .env.dev.local, SQUASH_TM_URL from .env.local.',
    );
    expect(formatSquashEnvLoad({ profile: 'dev', source: 'APP_ENV' }, applied)).not.toContain('secret');
  });

  test('parseSquashEnv keeps a quoted value and skips comments and other keys', () => {
    expect(parseSquashEnv("# comment\nexport SQUASH_TM_TOKEN='abc'\nNOT_SQUASH=1\n")).toEqual([
      ['SQUASH_TM_TOKEN', 'abc'],
    ]);
  });
});

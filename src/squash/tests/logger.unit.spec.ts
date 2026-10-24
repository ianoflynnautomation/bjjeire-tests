import { expect, test } from '@playwright/test';
import { SquashApiError } from '../infrastructure/squash-client';
import { ConsoleLogger, LogLevel } from '../infrastructure/logger';

test.describe('ConsoleLogger', { tag: ['@unit'] }, () => {
  test('prints the stack of an unexpected error and only the message of a Squash API error', () => {
    const lines: string[] = [];
    const logger = new ConsoleLogger(LogLevel.Info, line => {
      lines.push(line);
    });
    const apiError = new SquashApiError({ method: 'GET', path: '/test-cases' }, 503, 'busy', undefined);

    logger.error('Sync failed', new Error('disk full'));
    logger.error('Sync failed', apiError);

    const [unexpected, api] = lines;
    expect(unexpected).toContain('disk full');
    expect(unexpected).toContain('\n');
    expect(api).toBe('[squash-tm] ERROR Sync failed: GET /test-cases → 503: busy');
  });
});

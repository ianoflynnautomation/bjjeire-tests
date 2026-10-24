import type { Logger } from '../application/ports';

export const LogLevel = {
  Debug: 'debug',
  Info: 'info',
  Warn: 'warn',
  Error: 'error',
} as const;

export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

export function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * API errors already name the status and a body snippet. Anything else keeps
 * its stack: reporters catch failures, so the stack would otherwise be lost.
 */
function errorText(error: unknown): string {
  if (error instanceof Error && error.name !== 'SquashApiError' && error.stack) return error.stack;
  return describeError(error);
}

const ORDER: readonly LogLevel[] = [LogLevel.Debug, LogLevel.Info, LogLevel.Warn, LogLevel.Error];
const PREFIX = '[squash-tm]';

/** Writes to stderr so reporter output never mixes into Playwright's stdout reporters. */
export class ConsoleLogger implements Logger {
  constructor(
    private readonly minLevel: LogLevel = LogLevel.Info,
    private readonly write: (line: string) => void = line => process.stderr.write(`${line}\n`),
  ) {}

  debug(message: string): void {
    this.log(LogLevel.Debug, message);
  }

  info(message: string): void {
    this.log(LogLevel.Info, message);
  }

  warn(message: string): void {
    this.log(LogLevel.Warn, message);
  }

  error(message: string, error?: unknown): void {
    this.log(LogLevel.Error, error === undefined ? message : `${message}: ${errorText(error)}`);
  }

  private log(level: LogLevel, message: string): void {
    if (ORDER.indexOf(level) < ORDER.indexOf(this.minLevel)) return;
    this.write(`${PREFIX} ${level.toUpperCase()} ${message}`);
  }
}

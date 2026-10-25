import type { Logger } from '../application/contracts';
import type { RetryPolicy } from './config';
import { describeError } from './logger';
import {
  SquashApiError,
  SquashNetworkError,
  type HttpMethod,
  type SquashClient,
  type SquashRequest,
} from './squash-client';

const HTTP_REQUEST_TIMEOUT = 408;
const HTTP_TOO_MANY_REQUESTS = 429;
const HTTP_INTERNAL_SERVER_ERROR = 500;
const HTTP_BAD_GATEWAY = 502;
const HTTP_SERVICE_UNAVAILABLE = 503;
const HTTP_GATEWAY_TIMEOUT = 504;

/** The server refused before doing any work: safe to retry any method. */
const REJECTED_STATUSES: ReadonlySet<number> = new Set([HTTP_TOO_MANY_REQUESTS, HTTP_SERVICE_UNAVAILABLE]);
/** The request may have been processed: retry only when repeating it is harmless. */
const TRANSIENT_STATUSES: ReadonlySet<number> = new Set([
  HTTP_REQUEST_TIMEOUT,
  HTTP_INTERNAL_SERVER_ERROR,
  HTTP_BAD_GATEWAY,
  HTTP_GATEWAY_TIMEOUT,
]);
/** GET reads; PATCH here only sets fields to absolute values. POST creates, so a blind retry duplicates. */
const IDEMPOTENT_METHODS: ReadonlySet<HttpMethod> = new Set<HttpMethod>(['GET', 'PATCH']);

/** Half the backoff is fixed, half random, so parallel clients spread out without collapsing to zero. */
const JITTER_SHARE = 0.5;

export type RetryTiming = Readonly<{
  sleep: (ms: number) => Promise<void>;
  /** Uniform in [0, 1), like Math.random. */
  random: () => number;
}>;

const REAL_TIMING: RetryTiming = {
  sleep: ms => new Promise(resolve => setTimeout(resolve, ms)),
  random: Math.random,
};

/**
 * Decorator adding exponential backoff with jitter to any `SquashClient`.
 * Retries what is retryable for the method, honours `Retry-After`, and logs
 * every retry so a slow or flaky Squash instance is visible in CI output.
 */
export class RetryingSquashClient implements SquashClient {
  constructor(
    private readonly inner: SquashClient,
    private readonly logger: Logger,
    private readonly policy: RetryPolicy,
    private readonly timing: RetryTiming = REAL_TIMING,
  ) {}

  async send(request: SquashRequest): Promise<unknown> {
    for (let attempt = 1; ; attempt++) {
      try {
        return await this.inner.send(request);
      } catch (error) {
        if (attempt >= this.policy.maxAttempts || !isRetryable(error, request.method)) throw error;
        const delayMs = this.delayAfter(attempt, error);
        this.logger.warn(
          `Attempt ${attempt}/${this.policy.maxAttempts} failed: ${describeError(error)}. Retrying in ${delayMs} ms.`,
        );
        await this.timing.sleep(delayMs);
      }
    }
  }

  /** base · 2^(attempt-1), capped, jittered, and never shorter than a (capped) Retry-After. */
  private delayAfter(failedAttempt: number, error: unknown): number {
    const exponential = Math.min(this.policy.maxDelayMs, this.policy.baseDelayMs * 2 ** (failedAttempt - 1));
    const jittered = Math.round(exponential * (1 - JITTER_SHARE + JITTER_SHARE * this.timing.random()));
    const requested = error instanceof SquashApiError ? (error.retryAfterMs ?? 0) : 0;
    return Math.max(jittered, Math.min(requested, this.policy.maxDelayMs));
  }
}

function isRetryable(error: unknown, method: HttpMethod): boolean {
  const idempotent = IDEMPOTENT_METHODS.has(method);
  if (error instanceof SquashApiError) {
    return REJECTED_STATUSES.has(error.status) || (idempotent && TRANSIENT_STATUSES.has(error.status));
  }
  if (error instanceof SquashNetworkError) return idempotent || error.connectionRefused;
  return false;
}

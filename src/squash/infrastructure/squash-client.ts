/**
 * Transport contract for the Squash TM REST API. The repository depends on
 * this, never on `fetch`, so the HTTP library, the retry policy and test fakes
 * can each be swapped without touching data access.
 */
export type HttpMethod = 'GET' | 'POST' | 'PATCH';

export type SquashRequest = Readonly<{
  method: HttpMethod;
  /** Path under `/api/rest/latest`, e.g. `/test-cases/12`. */
  path: string;
  query?: Readonly<Record<string, string | number>>;
  body?: unknown;
}>;

export type SquashClient = Readonly<{
  /** Resolves with the parsed JSON body (`undefined` when empty); rejects with a `SquashClientError`. */
  send: (request: SquashRequest) => Promise<unknown>;
}>;

const API_ROOT = '/api/rest/latest';
const BODY_SNIPPET_LENGTH = 500;
const MS_PER_SECOND = 1000;
const MAX_CAUSE_DEPTH = 5;

export abstract class SquashClientError extends Error {
  constructor(
    readonly request: SquashRequest,
    message: string,
    options?: ErrorOptions,
  ) {
    super(`${request.method} ${request.path} → ${message}`, options);
  }
}

/** The server answered with a non-2xx status. */
export class SquashApiError extends SquashClientError {
  constructor(
    request: SquashRequest,
    readonly status: number,
    body: string,
    readonly retryAfterMs: number | undefined,
  ) {
    super(request, `${status}${body ? `: ${body.slice(0, BODY_SNIPPET_LENGTH)}` : ''}`);
    this.name = 'SquashApiError';
  }
}

/** No response: DNS, connection, TLS or timeout failure. */
export class SquashNetworkError extends SquashClientError {
  /** The connection was refused, so the server cannot have processed the request. */
  readonly connectionRefused: boolean;

  constructor(request: SquashRequest, cause: unknown) {
    super(request, `network error: ${causeMessage(cause)}`, { cause });
    this.name = 'SquashNetworkError';
    this.connectionRefused = errorCodes(cause).includes('ECONNREFUSED');
  }
}

/** A 2xx whose body is not JSON: typically an SSO or proxy login page answering in Squash's place. */
export class SquashUnexpectedResponseError extends SquashClientError {
  constructor(request: SquashRequest, body: string) {
    super(request, `2xx response is not JSON (a login page or proxy?): ${body.slice(0, BODY_SNIPPET_LENGTH)}`);
    this.name = 'SquashUnexpectedResponseError';
  }
}

type FetchSquashClientOptions = Readonly<{
  baseUrl: string;
  /** Personal API token, sent as `Authorization: Bearer`. */
  token: string;
  timeoutMs: number;
}>;

export class FetchSquashClient implements SquashClient {
  private readonly apiRoot: string;
  private readonly headers: Readonly<Record<string, string>>;
  private readonly timeoutMs: number;

  constructor(
    options: FetchSquashClientOptions,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {
    this.timeoutMs = options.timeoutMs;
    this.apiRoot = `${options.baseUrl.replace(/\/+$/, '')}${API_ROOT}`;
    this.headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${options.token}`,
    };
  }

  async send(request: SquashRequest): Promise<unknown> {
    const url = new URL(`${this.apiRoot}${request.path}`);
    for (const [name, value] of Object.entries(request.query ?? {})) url.searchParams.set(name, String(value));

    let response: Response;
    try {
      response = await this.fetchImpl(url, {
        method: request.method,
        headers: this.headers,
        signal: AbortSignal.timeout(this.timeoutMs),
        ...(request.body === undefined ? {} : { body: JSON.stringify(request.body) }),
      });
    } catch (error) {
      throw new SquashNetworkError(request, error);
    }

    const text = await response.text();
    if (!response.ok) {
      throw new SquashApiError(request, response.status, text, retryAfterMs(response.headers.get('retry-after')));
    }
    return parseJsonBody(request, text);
  }
}

function parseJsonBody(request: SquashRequest, text: string): unknown {
  if (text.length === 0) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new SquashUnexpectedResponseError(request, text);
  }
}

/** `Retry-After` is either delay-seconds or an HTTP date. */
function retryAfterMs(header: string | null): number | undefined {
  if (!header) return undefined;
  const seconds = Number(header);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * MS_PER_SECOND);
  const date = Date.parse(header);
  return Number.isNaN(date) ? undefined : Math.max(0, date - Date.now());
}

/** Node's fetch wraps the socket error: TypeError('fetch failed', { cause: { code } }). */
function errorCodes(error: unknown): string[] {
  const codes: string[] = [];
  let current = error;
  for (let depth = 0; depth < MAX_CAUSE_DEPTH && current instanceof Object; depth++) {
    const { code, cause } = current as { code?: unknown; cause?: unknown };
    if (typeof code === 'string') codes.push(code);
    current = cause;
  }
  return codes;
}

function causeMessage(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  return error.cause instanceof Error ? `${error.message} (${error.cause.message})` : error.message;
}

// Universal invalid inputs (tier 1 of the api-testing skill's data rule). Query strings and
// path segments are strings on the wire, so a "type mismatch" is a string the server cannot
// convert. Spring's boolean converter accepts true/false/on/off/yes/no/1/0, so those are not invalid.

/** Rejected by integer query params (`page`, `pageSize`) as `urn:bjjeire:bad-request`. */
export const INVALID_INTEGER_QUERY_VALUES = ['abc', '1.5'] as const;

/** Rejected by boolean query params (`includeInactive`) as `urn:bjjeire:bad-request`. */
export const INVALID_BOOLEAN_QUERY_VALUES = ['maybe', '2'] as const;

/** Rejected by enum query params (`county`, `types`) as `urn:bjjeire:bad-request`. */
export const INVALID_ENUM_QUERY_VALUES = ['Atlantis', '123'] as const;

/**
 * Path ids that break the 24-hex ObjectId pattern, rejected as `urn:bjjeire:validation-error`.
 * No `/` or `\`: Tomcat rejects those encoded before the API sees them.
 */
export const INVALID_OBJECT_ID_VALUES = [
  { description: 'a word', value: 'not-an-id' },
  { description: 'a numeric string', value: '99999' },
  { description: 'a boolean-like string', value: 'true' },
  { description: 'one character short', value: 'acce7790000000000000000' },
  { description: 'non-hex characters', value: 'zzzzzzzzzzzzzzzzzzzzzzzz' },
  { description: 'markup', value: '<script>' },
  { description: 'a query injection attempt', value: '1 OR 1=1' },
] as const;

/** A well-formed ObjectId that no environment seeds — the not-found case. */
export const UNPUBLISHED_OBJECT_ID = 'ffffffffffffffffffffffff';

/**
 * Paging bounds every listing shares (page >= 1, 1 <= pageSize <= 100), rejected as
 * `urn:bjjeire:validation-error` on `field`. Promoted from inline: all four listings use it.
 */
export const OUT_OF_RANGE_PAGING_VALUES = [
  { param: 'page', field: 'Page', value: 0 },
  { param: 'page', field: 'Page', value: -1 },
  { param: 'pageSize', field: 'PageSize', value: 0 },
  { param: 'pageSize', field: 'PageSize', value: 101 },
] as const;

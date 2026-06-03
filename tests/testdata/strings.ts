export const NO_MATCH_SEARCH_TERM = 'zzz-no-match-xyz';

// Window for "partial-match" search-term generation. The lower bound keeps
// the term selective enough to be a meaningful prefix; the upper bound
// keeps URLs short and avoids unwanted exact-match behaviour on long names.
const PARTIAL_NAME_MIN_CHARS = 3;
const PARTIAL_NAME_MAX_CHARS = 12;

export function partialName(name: string): string {
  return name.slice(0, Math.max(PARTIAL_NAME_MIN_CHARS, Math.min(PARTIAL_NAME_MAX_CHARS, name.length)));
}

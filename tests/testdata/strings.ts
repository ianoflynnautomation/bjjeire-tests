export const NO_MATCH_SEARCH_TERM = 'zzz-no-match-xyz';

export function partialName(name: string): string {
  return name.slice(0, Math.max(3, Math.min(12, name.length)));
}

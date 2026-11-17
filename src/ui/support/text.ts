export type TextMatcher = RegExp | string;

/** Escapes a literal for use inside a RegExp. */
export const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

import type { Locator } from '@playwright/test';

export type TextMatcher = RegExp | string;

export type CardReader<TCard extends object> = (root: Locator) => Promise<TCard>;

export type CardFieldTestIds<TCard extends object> = Readonly<Record<Extract<keyof TCard, string>, string>>;

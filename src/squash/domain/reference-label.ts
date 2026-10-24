/**
 * Readable Squash references for synced test cases: the feature folder plus a
 * number, `COMPETITIONS-001`, `EVENTS-012`. A label is assigned once, when the
 * case gets one, and never changes, so it stays a stable name for people even
 * if the test is later renamed or moved. It is not the sync's identity (that is
 * the automated test reference), so QA can rely on it without the sync relying
 * on it.
 */

const LABEL_DIGITS = 3;
const ROOT_PREFIX = 'PLAYWRIGHT';
/** The hash keys earlier versions of the sync wrote; such cases are relabelled. */
const LEGACY_KEY = /^PW-[0-9a-f]{12}$/;
const LABEL = /^([A-Z0-9]+(?:-[A-Z0-9]+)*)-(\d+)$/;

/** First paragraph of every description the sync writes: marks a case as sync-owned. */
export const OWNERSHIP_MARKER =
  '<p>Managed by the Playwright sync. Edits to the name or description are overwritten.</p>';

/** A case the sync created (or an empty one); a hand-written case is never relabelled or rewritten. */
export function isSyncOwned(description: string): boolean {
  return description === '' || description.startsWith(OWNERSHIP_MARKER);
}

/** A reference the sync may replace with a label: none yet, or a legacy `PW-…` hash. */
export function needsLabel(reference: string): boolean {
  return reference === '' || LEGACY_KEY.test(reference);
}

/** `Playwright/Features/Competitions` → `COMPETITIONS`; the project root → `PLAYWRIGHT`. */
export function labelPrefix(folder: string | undefined): string {
  const leaf = folder?.split('/').at(-1) ?? '';
  const prefix = leaf
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return prefix === '' ? ROOT_PREFIX : prefix;
}

/**
 * Hands out the next free number per prefix, continuing after the highest
 * label already in the project. Allocation is synchronous, so callers can
 * share one labeller without ever receiving the same label twice.
 */
export class ReferenceLabeller {
  private readonly highest = new Map<string, number>();

  constructor(existingReferences: readonly string[]) {
    for (const reference of existingReferences) {
      const [, prefix, number] = LABEL.exec(reference) ?? [];
      if (prefix !== undefined && number !== undefined) {
        this.highest.set(prefix, Math.max(this.highest.get(prefix) ?? 0, Number(number)));
      }
    }
  }

  next(prefix: string): string {
    const number = (this.highest.get(prefix) ?? 0) + 1;
    this.highest.set(prefix, number);
    return `${prefix}-${String(number).padStart(LABEL_DIGITS, '0')}`;
  }
}

import type { Page, TestInfo } from '@playwright/test';
import { API_BASE_PATH } from '@api/support/routes';

/**
 * Response mutation for test-adequacy audits (`scripts/mutation-audit.mjs`).
 *
 * A mutant is one deliberate, schema-shaped corruption of a real list response:
 * `<resource>:<operator>[:<field>]`, e.g. `bjjevent:rotate:county`. The browser
 * fetches the real response and the app receives the corrupted one. A spec that
 * still passes did not notice, so the behaviour that mutant breaks is unguarded.
 *
 * `observe` corrupts nothing: it records which list resources a spec reads and
 * which item fields they carry, so the runner can enumerate mutants without
 * knowing any feature. Specs that mock a route themselves are unaffected, since
 * their later `page.route` wins.
 */
export const MUTATION_OBSERVE = 'observe';

export const STRUCTURAL_OPERATORS = [
  'drop-first',
  'drop-last',
  'duplicate-first',
  'reverse',
  'empty',
  'total-plus-one',
] as const;
export const FIELD_OPERATORS = ['rotate', 'mangle'] as const;

type StructuralOperator = (typeof STRUCTURAL_OPERATORS)[number];
type FieldOperator = (typeof FIELD_OPERATORS)[number];

export type Mutant =
  | Readonly<{ resource: string; operator: StructuralOperator }>
  | Readonly<{ resource: string; operator: FieldOperator; field: string }>;

export type MutationReport = Readonly<{
  /** Responses the mutant actually changed. 0 means the mutant never bit. */
  applied: number;
  /** `observe` only: list resource → item field paths seen. */
  observed: Readonly<Record<string, readonly string[]>>;
}>;

export const MUTATION_ANNOTATION = 'mutation';

type JsonRecord = Record<string, unknown>;
type ListBody = JsonRecord & { data: unknown[]; pagination: JsonRecord };

const LIST_PATH = new RegExp(`^${API_BASE_PATH}/([a-z]+)$`);
const NOT_LISTS: ReadonlySet<string> = new Set(['featureflag']);
const SKIPPED_FIELDS: ReadonlySet<string> = new Set(['id', 'version']);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T.*)?$/;
const DAY_MS = 86_400_000;
const DATE_ONLY_LENGTH = 'YYYY-MM-DD'.length;

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isListBody = (value: unknown): value is ListBody =>
  isRecord(value) && Array.isArray(value['data']) && isRecord(value['pagination']);

const isOneOf = <T extends string>(values: readonly T[], value: string): value is T =>
  (values as readonly string[]).includes(value);

export function parseMutant(spec: string): Mutant {
  const [resource, operator, field] = spec.split(':');
  if (resource && operator && isOneOf(STRUCTURAL_OPERATORS, operator) && field === undefined) {
    return { resource, operator };
  }
  if (resource && operator && isOneOf(FIELD_OPERATORS, operator) && field) {
    return { resource, operator, field };
  }
  throw new Error(`PW_MUTANT '${spec}' is not <resource>:<operator>[:<field>]`);
}

function readPath(item: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((node, key) => (isRecord(node) ? node[key] : undefined), item);
}

function writePath(item: unknown, path: string, value: unknown): void {
  const keys = path.split('.');
  const last = keys.pop();
  const parent = keys.reduce<unknown>((node, key) => (isRecord(node) ? node[key] : undefined), item);
  if (last !== undefined && isRecord(parent) && last in parent) parent[last] = value;
}

/** Leaf field paths (objects descended, arrays and scalars are leaves), non-null somewhere. */
export function fieldPaths(items: readonly unknown[]): string[] {
  const paths = new Set<string>();
  const walk = (node: JsonRecord, prefix: string): void => {
    for (const [key, value] of Object.entries(node)) {
      const path = prefix ? `${prefix}.${key}` : key;
      if (SKIPPED_FIELDS.has(path) || value === null || value === undefined) continue;
      if (isRecord(value)) walk(value, path);
      else paths.add(path);
    }
  };
  for (const item of items) if (isRecord(item)) walk(item, '');
  return [...paths].sort();
}

/** A plausible wrong value of the same type: dates move a day, text gains a mark, lists lose one. */
function mangle(value: unknown): unknown {
  if (typeof value === 'string') {
    if (!ISO_DATE.test(value)) return `${value} ⁂`;
    const dateOnly = value.length === DATE_ONLY_LENGTH;
    const shifted = new Date(Date.parse(dateOnly ? `${value}T00:00:00Z` : value) + DAY_MS);
    return dateOnly ? shifted.toISOString().slice(0, DATE_ONLY_LENGTH) : shifted.toISOString();
  }
  if (typeof value === 'number') return value + 1;
  if (typeof value === 'boolean') return !value;
  if (Array.isArray(value)) return value.slice(1);
  return value;
}

export function applyMutant(body: ListBody, mutant: Mutant): ListBody {
  const next = structuredClone(body);
  const { data, pagination } = next;
  switch (mutant.operator) {
    case 'drop-first':
      data.shift();
      break;
    case 'drop-last':
      data.pop();
      break;
    case 'duplicate-first':
      if (data.length > 0) data.splice(1, 0, structuredClone(data[0]));
      break;
    case 'reverse':
      data.reverse();
      break;
    case 'empty':
      data.length = 0;
      break;
    case 'total-plus-one':
      if (typeof pagination['totalItems'] === 'number') pagination['totalItems'] += 1;
      break;
    case 'rotate': {
      const values = data.map(item => structuredClone(readPath(item, mutant.field)));
      data.forEach((item, i) => {
        writePath(item, mutant.field, values[(i + 1) % values.length]);
      });
      break;
    }
    case 'mangle':
      for (const item of data) writePath(item, mutant.field, mangle(readPath(item, mutant.field)));
      break;
  }
  return next;
}

/** Route every list endpoint through the mutant (or the observer) and report on teardown. */
export async function installResponseMutation(page: Page, spec: string): Promise<() => MutationReport> {
  const mutant = spec === MUTATION_OBSERVE ? undefined : parseMutant(spec);
  const observed: Record<string, Set<string>> = {};
  let applied = 0;

  await page.route(
    url => {
      const resource = LIST_PATH.exec(url.pathname)?.[1];
      return resource !== undefined && !NOT_LISTS.has(resource);
    },
    async route => {
      const response = await route.fetch();
      const resource = LIST_PATH.exec(new URL(route.request().url()).pathname)?.[1] ?? '';
      const body: unknown = await response.json().catch(() => undefined);
      if (!isListBody(body)) return route.fulfill({ response });

      if (!mutant) {
        const seen = (observed[resource] ??= new Set());
        for (const path of fieldPaths(body.data)) seen.add(path);
        return route.fulfill({ response });
      }
      if (mutant.resource !== resource) return route.fulfill({ response });

      const mutated = applyMutant(body, mutant);
      if (JSON.stringify(mutated) !== JSON.stringify(body)) applied += 1;
      return route.fulfill({ response, json: mutated });
    },
  );

  return () => ({
    applied,
    observed: Object.fromEntries(Object.entries(observed).map(([resource, paths]) => [resource, [...paths].sort()])),
  });
}

export function annotateMutation(testInfo: TestInfo, report: MutationReport): void {
  testInfo.annotations.push({ type: MUTATION_ANNOTATION, description: JSON.stringify(report) });
}

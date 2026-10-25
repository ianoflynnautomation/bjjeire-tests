import type { TestCaseDefinition } from './test-case';

/**
 * One Playwright test, however many projects run it. Steps are ignored: a
 * passing project reports them and a failing one does not, and that is still
 * the same test. Playwright's own test id is ignored too, because it changes
 * per project.
 */
export function sameLogicalTest(left: TestCaseDefinition, right: TestCaseDefinition): boolean {
  return (
    left.file === right.file &&
    left.line === right.line &&
    left.pinnedId === right.pinnedId &&
    sameTitles(left.titles, right.titles)
  );
}

export type GroupedDefinitions = Readonly<{
  /** One definition per identity. A logical test seen twice (two projects) contributes once. */
  definitions: readonly TestCaseDefinition[];
  /** Identities claimed by two or more different tests. None of them is in `definitions`. */
  collisions: readonly (readonly TestCaseDefinition[])[];
}>;

/** Keeps steps from whichever copy has them. A shared key with two different tests is a collision, not a definition. */
export function groupDefinitions(definitions: readonly TestCaseDefinition[]): GroupedDefinitions {
  const groups = new Map<string, TestCaseDefinition[]>();
  for (const definition of definitions) addDefinition(groups, definition);
  const unique: TestCaseDefinition[] = [];
  const collisions: TestCaseDefinition[][] = [];
  for (const group of groups.values()) {
    const [only] = group;
    if (group.length === 1 && only) unique.push(only);
    else if (group.length > 1) collisions.push(group);
  }
  return { definitions: unique, collisions };
}

export function duplicateIdentityMessage(definitions: readonly TestCaseDefinition[]): string {
  const listed = [...definitions]
    .sort(byLocation)
    .map(definition => `${definition.file}:${definition.line} ("${definition.name}")`)
    .join(' and ');
  return `${listed} share one Squash identity "${definitions[0]?.key ?? ''}"`;
}

function addDefinition(groups: Map<string, TestCaseDefinition[]>, definition: TestCaseDefinition): void {
  const group = groups.get(definition.key) ?? [];
  const index = group.findIndex(candidate => sameLogicalTest(candidate, definition));
  const existing = index === -1 ? undefined : group[index];
  if (!existing) group.push(definition);
  else if (existing.steps === undefined && definition.steps !== undefined) group[index] = definition;
  groups.set(definition.key, group);
}

function sameTitles(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((title, index) => title === right[index]);
}

function byLocation(left: TestCaseDefinition, right: TestCaseDefinition): number {
  return left.file.localeCompare(right.file) || left.line - right.line || left.name.localeCompare(right.name);
}

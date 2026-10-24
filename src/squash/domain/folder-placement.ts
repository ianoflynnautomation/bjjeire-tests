import type { TestCaseDefinition } from './test-case';

/** Maps a test to a Squash folder: a spec path prefix and/or a tag (at least one). */
export type FolderRule = Readonly<{
  /** Spec path prefix relative to the test dir: `features/gyms/`. */
  path?: string | undefined;
  /** A tag the test must carry: `@api`. */
  tag?: string | undefined;
  /** Squash folder path: `Acceptance/Gyms`. */
  folder: string;
}>;

export type FolderPlacement = Readonly<{
  /** Folder for tests no rule matches; the project root when undefined. */
  defaultFolder: string | undefined;
  /** First match wins, so put specific rules before broad ones. */
  rules: readonly FolderRule[];
}>;

/** The folder path a new test case belongs in; `undefined` is the project root. */
export function folderFor(definition: TestCaseDefinition, placement: FolderPlacement): string | undefined {
  const rule = placement.rules.find(
    ({ path, tag }) =>
      (path === undefined || definition.file.startsWith(path)) && (tag === undefined || definition.tags.includes(tag)),
  );
  return rule?.folder ?? placement.defaultFolder;
}

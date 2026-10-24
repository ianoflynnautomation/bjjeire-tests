import type { FolderId, FolderTree } from './ports';

/**
 * Turns a folder path such as `Acceptance/Gyms` into a Squash folder id,
 * creating each missing folder on the way. Each path prefix is resolved once
 * per run and shared, so concurrent callers never create the same folder
 * twice (Squash does not stop sibling folders sharing a name).
 */
export class FolderPathResolver {
  private readonly resolved = new Map<string, Promise<FolderId | undefined>>();

  constructor(private readonly tree: FolderTree) {}

  /** `undefined` (or an empty path) is the library root. */
  ensure(path: string | undefined): Promise<FolderId | undefined> {
    const segments = (path ?? '').split('/').filter(segment => segment.length > 0);
    return this.ensureSegments(segments);
  }

  private ensureSegments(segments: readonly string[]): Promise<FolderId | undefined> {
    const key = segments.join('/');
    const cached = this.resolved.get(key);
    if (cached) return cached;
    const name = segments.at(-1);
    const folder =
      name === undefined
        ? Promise.resolve(undefined)
        : this.ensureSegments(segments.slice(0, -1)).then(parentId => this.child(parentId, name));
    this.resolved.set(key, folder);
    return folder;
  }

  private async child(parentId: FolderId | undefined, name: string): Promise<FolderId> {
    const existing = (await this.tree.children(parentId)).find(node => node.kind === 'folder' && node.name === name);
    return existing ? (existing.id as FolderId) : this.tree.createFolder(parentId, name);
  }
}

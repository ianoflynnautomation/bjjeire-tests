import type { FolderId, FolderTree, LibraryNode } from '../application/contracts';
import { collectPages, DEFAULT_PAGE_SIZE } from './collect-pages';
import { createResource } from './create-resource';
import { SquashPayloadBuilder } from './payload-builder';
import type { SquashClient } from './squash-client';
import { LIBRARY_CONTENT_KEYS, libraryPageSchema, parseWire, type LibraryParent } from './rest-schemas';

export type Library = 'test-case' | 'campaign';

/** One of a project's two Squash libraries (test cases, campaigns) as a `FolderTree`. */
export class HttpFolderTree implements FolderTree {
  private readonly folderType: `${Library}-folder`;

  constructor(
    private readonly client: SquashClient,
    private readonly projectId: number,
    private readonly library: Library,
    private readonly payloads = new SquashPayloadBuilder(),
  ) {
    this.folderType = `${library}-folder`;
  }

  async children(folderId: FolderId | undefined): Promise<readonly LibraryNode[]> {
    const atRoot = folderId === undefined;
    const path = atRoot
      ? `/projects/${this.projectId}/${this.library}s-library/content`
      : `/${this.folderType}s/${folderId}/content`;
    const contentKey = atRoot
      ? LIBRARY_CONTENT_KEYS[this.library === 'test-case' ? 'testCaseRoot' : 'campaignRoot']
      : LIBRARY_CONTENT_KEYS.folder;
    const nodes = await collectPages(this.client, { path, pageSize: DEFAULT_PAGE_SIZE }, body =>
      parseWire(libraryPageSchema(contentKey), body, `GET ${path}`),
    );
    return nodes.map(({ _type, id, name }) => ({ kind: _type === this.folderType ? 'folder' : 'leaf', id, name }));
  }

  async createFolder(parentId: FolderId | undefined, name: string): Promise<FolderId> {
    const path = `/${this.folderType}s`;
    const body = this.payloads.createFolder(this.library, this.parentOf(parentId), name);
    return (await createResource(this.client, path, body)) as FolderId;
  }

  parentOf(folderId: FolderId | undefined): LibraryParent {
    return folderId === undefined ? { _type: 'project', id: this.projectId } : { _type: this.folderType, id: folderId };
  }
}

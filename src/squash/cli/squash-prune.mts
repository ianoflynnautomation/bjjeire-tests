/**
 * npm run squash:prune -- --folder <path> [--folder <path> ...] [--yes]
 *
 * Deletes test cases the sync created that sit in the given Squash folders, for
 * example after renaming tests (an unpinned rename creates a new case) or after
 * changing `testCaseFolder`. The sync itself never deletes, so this is the one
 * deliberate way to retire them.
 *
 *   npm run squash:prune -- --folder Playwright              # preview: lists what would go
 *   npm run squash:prune -- --folder Playwright --folder / --yes
 *
 * - `--folder` is a path below the project root (`Playwright/Features/Gyms`),
 *   matched with its subfolders. `/` means cases directly at the project root.
 * - Only cases carrying the sync's ownership marker are deleted. Hand-written
 *   cases are listed and kept, and a folder still holding one is kept.
 * - Without `--yes` nothing is changed.
 *
 * Connection comes from SQUASH_TM_URL, SQUASH_TM_TOKEN and SQUASH_TM_PROJECT_ID,
 * read from the shell or the same .env files the suite loads
 * (`.env.<APP_ENV>.local`, `.env.<APP_ENV>`, `.env.local`, `.env`).
 *
 * Plain Node (type stripping, no imports from src), like squash-run.mts.
 */
import { existsSync } from 'node:fs';

/** Mirrors OWNERSHIP_MARKER in src/squash/domain/reference-label.ts. */
const OWNERSHIP_MARKER = '<p>Managed by the Playwright sync.';
const API_ROOT = '/api/rest/latest';
const PAGE_SIZE = 200;
const DELETE_BATCH = 50;
const ROOT = '/';
/** Unescaped `/`: Squash escapes a slash inside a name as `\/`. */
const PATH_SEPARATOR = /(?<!\\)\//;

type Options = Readonly<{ folders: readonly string[]; confirmed: boolean }>;
type Connection = Readonly<{ apiRoot: string; token: string; projectId: string }>;
type TestCase = Readonly<{ id: number; folder: string; name: string; owned: boolean }>;
type LibraryNode = Readonly<{ _type: string; id: number; name: string }>;
type Page<T> = Readonly<{ _embedded?: Record<string, T[]>; page: { totalPages: number } }>;

function log(line: string): void {
  process.stdout.write(`${line}\n`);
}

function loadEnvFiles(): void {
  const profile = (process.env['APP_ENV'] ?? 'local').toLowerCase();
  // Already-set variables win, so the shell beats every file and earlier files beat later ones.
  for (const file of [`.env.${profile}.local`, `.env.${profile}`, '.env.local', '.env']) {
    if (existsSync(file)) process.loadEnvFile(file);
  }
}

function parseArgs(argv: readonly string[]): Options {
  const folders: string[] = [];
  let confirmed = false;
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index] ?? '';
    if (arg === '--yes') confirmed = true;
    else if (arg.startsWith('--folder=')) folders.push(arg.slice('--folder='.length));
    else if (arg === '--folder' && argv[index + 1] !== undefined) folders.push(argv[++index] ?? '');
    else throw new Error(`Unknown argument ${arg}. Usage: squash:prune -- --folder <path> [--folder <path>] [--yes]`);
  }
  if (folders.length === 0)
    throw new Error('Name at least one --folder (a path such as Playwright, or / for the root).');
  return { folders: folders.map(folder => (folder === ROOT ? ROOT : folder.replace(/^\/+|\/+$/g, ''))), confirmed };
}

function connection(): Connection {
  const read = (name: string): string => {
    const value = process.env[name]?.trim();
    if (!value) throw new Error(`${name} is not set (shell or .env file).`);
    return value;
  };
  return {
    apiRoot: `${read('SQUASH_TM_URL').replace(/\/+$/, '')}${API_ROOT}`,
    token: read('SQUASH_TM_TOKEN'),
    projectId: read('SQUASH_TM_PROJECT_ID'),
  };
}

async function send(squash: Connection, method: 'GET' | 'DELETE', path: string): Promise<unknown> {
  const response = await fetch(`${squash.apiRoot}${path}`, {
    method,
    headers: { Authorization: `Bearer ${squash.token}`, Accept: 'application/json' },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${method} ${path} → HTTP ${response.status}: ${text.slice(0, PAGE_SIZE)}`);
  return text === '' ? undefined : (JSON.parse(text) as unknown);
}

async function allPages<T>(squash: Connection, path: string, key: string): Promise<T[]> {
  const items: T[] = [];
  for (let page = 0; ; page++) {
    const separator = path.includes('?') ? '&' : '?';
    const body = (await send(squash, 'GET', `${path}${separator}page=${page}&size=${PAGE_SIZE}`)) as Page<T>;
    items.push(...(body._embedded?.[key] ?? []));
    if (page + 1 >= body.page.totalPages) return items;
  }
}

/** `/project/Folder/Sub/Name` → folder `Folder/Sub`; a root case has folder ``. */
function testCaseOf(raw: { id: number; path?: string; description?: string }): TestCase {
  const segments = (raw.path ?? '').split(PATH_SEPARATOR).slice(2);
  return {
    id: raw.id,
    folder: segments.slice(0, -1).join('/'),
    name: (segments.at(-1) ?? '').replaceAll('\\/', '/'),
    owned: (raw.description ?? '').startsWith(OWNERSHIP_MARKER),
  };
}

function inFolder(testCase: TestCase, folder: string): boolean {
  if (folder === ROOT) return testCase.folder === '';
  return testCase.folder === folder || testCase.folder.startsWith(`${folder}/`);
}

async function folderId(squash: Connection, path: string): Promise<number | undefined> {
  let id: number | undefined;
  for (const name of path.split('/')) {
    const listing =
      id === undefined
        ? await allPages<LibraryNode>(
            squash,
            `/projects/${squash.projectId}/test-cases-library/content`,
            'test-case-library-content',
          )
        : await allPages<LibraryNode>(squash, `/test-case-folders/${id}/content`, 'content');
    id = listing.find(node => node._type === 'test-case-folder' && node.name === name)?.id;
    if (id === undefined) return undefined;
  }
  return id;
}

async function main(): Promise<void> {
  loadEnvFiles();
  const { folders, confirmed } = parseArgs(process.argv.slice(2));
  const squash = connection();

  const raw = await allPages<{ id: number; path?: string; description?: string }>(
    squash,
    `/projects/${squash.projectId}/test-cases?fields=name,path,description`,
    'test-cases',
  );
  const inScope = raw.map(testCaseOf).filter(testCase => folders.some(folder => inFolder(testCase, folder)));
  const doomed = inScope.filter(testCase => testCase.owned);
  const kept = inScope.filter(testCase => !testCase.owned);

  log(`Project ${squash.projectId}: ${doomed.length} sync-owned cases in ${folders.join(', ')}.`);
  for (const testCase of kept) log(`  keeping hand-written case ${testCase.id}: ${testCase.folder}/${testCase.name}`);
  if (!confirmed) {
    for (const testCase of doomed) log(`  would delete ${testCase.id}: ${testCase.folder || ROOT} › ${testCase.name}`);
    log('Preview only. Re-run with --yes to delete them.');
    return;
  }

  for (let index = 0; index < doomed.length; index += DELETE_BATCH) {
    const ids = doomed.slice(index, index + DELETE_BATCH).map(testCase => testCase.id);
    await send(squash, 'DELETE', `/test-cases/${ids.join(',')}`);
    log(`  deleted ${index + ids.length}/${doomed.length}`);
  }
  for (const folder of folders.filter(path => path !== ROOT)) {
    if (kept.some(testCase => inFolder(testCase, folder))) {
      log(`  keeping folder ${folder}: it still holds hand-written cases`);
      continue;
    }
    const id = await folderId(squash, folder);
    if (id === undefined) continue;
    await send(squash, 'DELETE', `/test-case-folders/${id}`);
    log(`  deleted folder ${folder}`);
  }
  log('Done. Run `SQUASH_TM_MODE=publish npm run squash:sync` to recreate current tests.');
}

main().catch((error: unknown) => {
  process.stderr.write(`[squash-tm] ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});

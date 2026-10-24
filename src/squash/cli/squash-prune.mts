/**
 * Deletes sync-owned cases in the named folders. An empty description is not
 * the ownership marker, so it is kept, and a folder that still holds a
 * hand-written case is kept. Without `--yes` nothing is deleted. `/` is the
 * project root. Plain Node; it imports only the shared ESM library module.
 */
import {
  casesInFolders,
  inFolder,
  parseListedPage,
  readEveryPage,
  readListedCases,
} from '../domain/squash-library.mts';
import { applySquashEnv, readSquashEnvFiles } from '../infrastructure/squash-env.mts';

const API_ROOT = '/api/rest/latest';
const PAGE_SIZE = 200;
const DELETE_BATCH = 50;
const REQUEST_TIMEOUT_MS = 30_000;
const ROOT = '/';

type Options = Readonly<{ folders: readonly string[]; confirmed: boolean }>;
type Connection = Readonly<{ apiRoot: string; token: string; projectId: string }>;

function log(line: string): void {
  process.stdout.write(`${line}\n`);
}

function loadEnvFiles(): void {
  const profile = (process.env['APP_ENV'] ?? 'local').toLowerCase();
  applySquashEnv(process.env, readSquashEnvFiles(process.cwd(), profile));
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
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${method} ${path} → HTTP ${response.status}: ${text.slice(0, PAGE_SIZE)}`);
  if (text === '') return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    throw new Error(`${method} ${path} returned HTTP ${response.status} that is not JSON`, { cause: error });
  }
}

async function allPages(squash: Connection, path: string, key: string): Promise<unknown[]> {
  return readEveryPage(async page => {
    const separator = path.includes('?') ? '&' : '?';
    return parseListedPage(await send(squash, 'GET', `${path}${separator}page=${page}&size=${PAGE_SIZE}`), key);
  });
}

async function folderId(squash: Connection, path: string): Promise<number | undefined> {
  let id: number | undefined;
  for (const name of path.split('/')) {
    const listing =
      id === undefined
        ? await allPages(
            squash,
            `/projects/${squash.projectId}/test-cases-library/content`,
            'test-case-library-content',
          )
        : await allPages(squash, `/test-case-folders/${id}/content`, 'content');
    id = listing.map(node => folderNamed(node, name)).find(match => match !== undefined);
    if (id === undefined) return undefined;
  }
  return id;
}

function folderNamed(node: unknown, name: string): number | undefined {
  if (typeof node !== 'object' || node === null) return undefined;
  const record = node as { _type?: unknown; id?: unknown; name?: unknown };
  if (record._type !== 'test-case-folder' || record.name !== name || typeof record.id !== 'number') return undefined;
  return record.id;
}

async function main(): Promise<void> {
  loadEnvFiles();
  const { folders, confirmed } = parseArgs(process.argv.slice(2));
  const squash = connection();
  const listed = await readListedCases(
    page =>
      send(
        squash,
        'GET',
        `/projects/${squash.projectId}/test-cases?fields=name,path,description&page=${page}&size=${PAGE_SIZE}`,
      ),
    'test-cases',
  );
  const inScope = casesInFolders(listed, folders);
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
    if (kept.some(testCase => inFolder(testCase.folder, folder))) {
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

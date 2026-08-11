const WRITE_DEBOUNCE_MS = 400;

const DOCS_THE_WORLD_CANNOT_OPEN_WITHOUT = ['pipeline', 'tiles', 'pieces', 'cultures'];

const preloaded = new Map<string, unknown>();
const revisions = new Map<string, string>();
const unreachable = new Set<string>();
const writeTimers = new Map<string, ReturnType<typeof setTimeout>>();

const RESOURCE_PATHS: Readonly<Record<string, string>> = {
  pipeline: '/api/v1/asset-library/worlds/current',
  tiles: '/api/v1/asset-library/tiles',
  templates: '/api/v1/asset-library/node-groups',
  worldPresets: '/api/v1/asset-library/worlds',
  pieces: '/api/v1/asset-library/pieces',
  cultures: '/api/v1/asset-library/cultures',
  creatures: '/api/v1/asset-library/creatures',
  items: '/api/v1/asset-library/items',
  uiState: '/api/v1/app-shell/state',
  worldThumbnails: '/api/v1/asset-library/worlds/thumbnails',
};

export async function preloadPersistedFiles(names: readonly string[]): Promise<void> {
  await Promise.all(names.map(preloadOne));
  reportDocsTheServerNeverGave(names);
}

async function preloadOne(name: string): Promise<void> {
  try {
    const response = await fetch(resourcePath(name));
    if (response.ok) acceptDocumentResponse(name, response, await response.json());
  } catch {
    unreachable.add(name);
  }
}

function reportDocsTheServerNeverGave(names: readonly string[]): void {
  if (unreachable.size > 0) {
    return console.error(
      `[persist] The game server did not answer for ${[...unreachable].join(', ')}. Nothing is stored in this browser, so start the server before loading the app.`,
    );
  }
  const missing = names.filter(
    (name) => !preloaded.has(name) && DOCS_THE_WORLD_CANNOT_OPEN_WITHOUT.includes(name),
  );
  if (missing.length === 0) return;
  console.error(
    `[persist] The database holds no ${missing.join(', ')}, so the world opens without them. Run \`npm run docs:seed\` to load the repo data files into it.`,
  );
}

export function seedPersistedFile(name: string, value: unknown): void {
  preloaded.set(name, value);
}

export function readPersistedFile<T>(name: string): T | null {
  return preloaded.has(name) ? (preloaded.get(name) as T) : null;
}

export function writePersistedFile(name: string, value: unknown): void {
  preloaded.set(name, value);
  clearTimeout(writeTimers.get(name));
  writeTimers.set(name, setTimeout(() => pushToServer(name, value), WRITE_DEBOUNCE_MS));
}

function pushToServer(name: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  void saveCurrent(name, value).catch(() =>
    console.error(`[persist] Could not save ${name}: the server did not accept the write.`),
  );
}

async function saveCurrent(name: string, value: unknown): Promise<void> {
  const response = await putDocument(name, value);
  if (response.status === 412) {
    await refreshRevision(name);
    const retry = await putDocument(name, value);
    if (!retry.ok) throw new Error(`save ${name} failed with ${retry.status}`);
    acceptDocumentResponse(name, retry, await retry.json());
    return;
  }
  if (!response.ok) throw new Error(`save ${name} failed with ${response.status}`);
  acceptDocumentResponse(name, response, await response.json());
}

function putDocument(name: string, value: unknown): Promise<Response> {
  return fetch(resourcePath(name), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'If-Match': `"${revisions.get(name) ?? '0'}"`,
    },
    body: JSON.stringify(value),
  });
}

async function refreshRevision(name: string): Promise<void> {
  const response = await fetch(resourcePath(name));
  if (!response.ok) throw new Error(`refresh ${name} failed with ${response.status}`);
  const envelope = (await response.json()) as { revision?: unknown };
  if (typeof envelope.revision === 'string') revisions.set(name, envelope.revision);
}

function acceptDocumentResponse(name: string, response: Response, raw: unknown): void {
  const envelope = raw as { data?: unknown; revision?: unknown };
  preloaded.set(name, envelope.data);
  const headerRevision = response.headers.get('etag')?.replace(/^"|"$/g, '');
  const bodyRevision = typeof envelope.revision === 'string' ? envelope.revision : null;
  if (headerRevision ?? bodyRevision) revisions.set(name, (headerRevision ?? bodyRevision)!);
}

function resourcePath(name: string): string {
  const path = RESOURCE_PATHS[name];
  if (!path) throw new Error(`no API resource owns persisted document ${name}`);
  return path;
}

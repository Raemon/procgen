const WRITE_DEBOUNCE_MS = 400;

const DOCS_THE_WORLD_CANNOT_OPEN_WITHOUT = ['pipeline', 'tiles', 'pieces', 'cultures'];

const preloaded = new Map<string, unknown>();
const unreachable = new Set<string>();
const writeTimers = new Map<string, ReturnType<typeof setTimeout>>();

export async function preloadPersistedFiles(names: string[]): Promise<void> {
  await Promise.all(names.map(preloadOne));
  reportDocsTheServerNeverGave(names);
}

async function preloadOne(name: string): Promise<void> {
  try {
    const response = await fetch(`/persist/${name}`);
    if (response.ok) preloaded.set(name, await response.json());
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
  void fetch(`/persist/${name}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
  }).catch(() =>
    console.error(`[persist] Could not save ${name}: the game server did not accept the write.`),
  );
}

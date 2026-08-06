import { readJson, writeJson } from './localJsonStore';

const WRITE_DEBOUNCE_MS = 400;

const preloaded = new Map<string, unknown>();
let serverAvailable = false;
const writeTimers = new Map<string, number>();

export async function preloadPersistedFiles(names: string[]): Promise<void> {
  await Promise.all(names.map(preloadOne));
}

async function preloadOne(name: string): Promise<void> {
  try {
    const response = await fetch(`/persist/${name}`);
    if (response.ok) {
      serverAvailable = true;
      preloaded.set(name, await response.json());
      return;
    }
    if (response.status === 404) {
      serverAvailable = true;
      migrateLocalStorageToFile(name);
    }
  } catch {
    return;
  }
}

function migrateLocalStorageToFile(name: string): void {
  const stored = readJson<unknown>(localStorageKeyOf(name));
  if (stored !== null) pushToServer(name, stored);
}

export function readPersistedFile<T>(name: string): T | null {
  if (preloaded.has(name)) return preloaded.get(name) as T;
  return readJson<T>(localStorageKeyOf(name));
}

export function writePersistedFile(name: string, value: unknown): void {
  if (!serverAvailable) {
    writeJson(localStorageKeyOf(name), value);
    return;
  }
  preloaded.set(name, value);
  clearTimeout(writeTimers.get(name));
  writeTimers.set(
    name,
    window.setTimeout(() => pushToServer(name, value), WRITE_DEBOUNCE_MS),
  );
}

function pushToServer(name: string, value: unknown): void {
  void fetch(`/persist/${name}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
  }).catch(() => writeJson(localStorageKeyOf(name), value));
}

function localStorageKeyOf(name: string): string {
  return `procgen.${name}.v1`;
}

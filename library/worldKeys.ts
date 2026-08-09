const SAVED_PREFIX = 'saved:';
const EXAMPLE_PREFIX = 'example:';

export interface StoredWorldKey {
  name: string;
  saved: boolean;
}

export function savedWorldKey(name: string): string {
  return SAVED_PREFIX + name;
}

export function exampleWorldKey(name: string): string {
  return EXAMPLE_PREFIX + name;
}

export function storedWorldOf(key: string): StoredWorldKey | null {
  if (key.startsWith(SAVED_PREFIX)) return { name: key.slice(SAVED_PREFIX.length), saved: true };
  if (key.startsWith(EXAMPLE_PREFIX)) return { name: key.slice(EXAMPLE_PREFIX.length), saved: false };
  return null;
}

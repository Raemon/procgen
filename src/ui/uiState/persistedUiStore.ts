import { readJson, writeJson } from '../../persistence/localJsonStore';

type Listener = () => void;

const snapshots = new Map<string, unknown>();
const listeners = new Map<string, Set<Listener>>();

export function persistedUiValue<T>(
  key: string,
  fallback: T,
  isValid: (value: unknown) => value is T,
): T {
  if (!snapshots.has(key)) snapshots.set(key, storedOrFallback(key, fallback, isValid));
  return snapshots.get(key) as T;
}

export function writePersistedUiValue<T>(key: string, value: T): void {
  snapshots.set(key, value);
  writeJson(storageKeyOf(key), value);
  for (const listener of listeners.get(key) ?? []) listener();
}

export function subscribeToPersistedUiValue(key: string, listener: Listener): () => void {
  const forKey = listeners.get(key) ?? new Set<Listener>();
  listeners.set(key, forKey);
  forKey.add(listener);
  return () => void forKey.delete(listener);
}

function storedOrFallback<T>(
  key: string,
  fallback: T,
  isValid: (value: unknown) => value is T,
): T {
  const stored = readJson<unknown>(storageKeyOf(key));
  return isValid(stored) ? stored : fallback;
}

function storageKeyOf(key: string): string {
  return `procgen.ui.${key}.v1`;
}

import { sanitizeSavedWorlds, type SavedWorld } from './savedWorld';

export interface StoredSavedWorlds {
  worlds: SavedWorld[];
}

export function savedWorldsFromStoredJson(raw: unknown): StoredSavedWorlds {
  if (Array.isArray(raw)) return { worlds: sanitizeSavedWorlds(raw) };
  const held = (raw ?? {}) as { worlds?: unknown };
  return { worlds: sanitizeSavedWorlds(held.worlds) };
}

import { sanitizeWorldSeeds, type WorldSeed } from './worldSeed';

export interface StoredWorldSeedLibrary {
  seeds: WorldSeed[];
  hiddenExamples: string[];
}

export function worldSeedLibraryFromStoredJson(raw: unknown): StoredWorldSeedLibrary {
  if (Array.isArray(raw)) return { seeds: sanitizeWorldSeeds(raw), hiddenExamples: [] };
  const held = (raw ?? {}) as { seeds?: unknown; presets?: unknown; hiddenExamples?: unknown };
  return {
    seeds: sanitizeWorldSeeds(held.seeds ?? held.presets),
    hiddenExamples: nameList(held.hiddenExamples),
  };
}

function nameList(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.filter((name): name is string => typeof name === 'string') : [];
}

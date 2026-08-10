import { sanitizeWorldPresets, type WorldPreset } from './worldPreset';

export interface StoredWorldLibrary {
  presets: WorldPreset[];
  hiddenExamples: string[];
}

export function worldLibraryFromStoredJson(raw: unknown): StoredWorldLibrary {
  if (Array.isArray(raw)) return { presets: sanitizeWorldPresets(raw), hiddenExamples: [] };
  const held = (raw ?? {}) as { presets?: unknown; hiddenExamples?: unknown };
  return {
    presets: sanitizeWorldPresets(held.presets),
    hiddenExamples: nameList(held.hiddenExamples),
  };
}

function nameList(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.filter((name): name is string => typeof name === 'string') : [];
}

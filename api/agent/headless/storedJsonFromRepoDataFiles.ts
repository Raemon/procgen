import { existsSync, readFileSync } from 'node:fs';
import type { StoredWorldJson } from '../serverWorldAssets';

export function storedJsonFromRepoDataFiles(overrides: Record<string, unknown> = {}): StoredWorldJson {
  return (name) => {
    if (name in overrides) return overrides[name] ?? null;
    return repoDataFile(name);
  };
}

function repoDataFile(name: string): unknown {
  const path = `data/${name}.json`;
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}

import { readPersistedFile, writePersistedFile } from '../persistence/repoFileStore';
import { EMPTY_VOXEL, MAX_PREFAB_LAYERS, MAX_PREFAB_SIDE, type Prefab } from './prefabDef';

const FILE_NAME = 'prefabs';

export function loadStoredPrefabs(): Prefab[] | null {
  const parsed = readPersistedFile<unknown>(FILE_NAME);
  if (!Array.isArray(parsed)) return null;
  const prefabs = parsed.filter(isPrefab);
  return prefabs.length > 0 ? prefabs : null;
}

export function storePrefabs(prefabs: readonly Prefab[]): void {
  writePersistedFile(FILE_NAME, prefabs);
}

function isPrefab(value: unknown): value is Prefab {
  if (typeof value !== 'object' || value === null) return false;
  const prefab = value as Partial<Prefab>;
  if (typeof prefab.id !== 'number' || typeof prefab.name !== 'string') return false;
  if (!isSide(prefab.width, MAX_PREFAB_SIDE) || !isSide(prefab.depth, MAX_PREFAB_SIDE)) return false;
  if (!isSide(prefab.layers, MAX_PREFAB_LAYERS)) return false;
  return hasVoxelsForExtent(prefab as Prefab);
}

function isSide(value: unknown, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= max;
}

function hasVoxelsForExtent(prefab: Prefab): boolean {
  return (
    Array.isArray(prefab.voxels) &&
    prefab.voxels.length === prefab.width * prefab.depth * prefab.layers &&
    prefab.voxels.every((voxel) => typeof voxel === 'number' && voxel >= EMPTY_VOXEL)
  );
}

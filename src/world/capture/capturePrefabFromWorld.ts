import {
  prefabFromWorldRegion,
  regionSize,
  type RegionSampler,
  type WorldRegion,
} from '../../prefabs/captureRegionAsPrefab';
import type { Prefab } from '../../prefabs/prefabDef';
import type { PrefabLibrary } from '../../prefabs/prefabLibrary';

export function capturePrefabFromWorld(
  prefabs: PrefabLibrary,
  sampler: RegionSampler,
  region: WorldRegion,
): Prefab {
  return prefabs.insert(prefabFromWorldRegion(sampler, region, capturedName(region)));
}

function capturedName(region: WorldRegion): string {
  const { width, depth } = regionSize(region);
  return `capture ${width}×${depth}`;
}

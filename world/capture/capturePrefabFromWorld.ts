import {
  prefabFromWorldRegion,
  regionSize,
  type RegionSampler,
  type WorldRegion,
} from '../../library/prefabs/captureRegionAsPrefab';
import type { Prefab } from '../../library/prefabs/prefabDef';
import type { PrefabLibrary } from '../../library/prefabs/prefabLibrary';

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

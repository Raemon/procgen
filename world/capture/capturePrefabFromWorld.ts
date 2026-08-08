import {
  prefabFromWorldRegion,
  regionSize,
  type RegionSampler,
  type WorldRegion,
} from '../../assets/prefabs/captureRegionAsPrefab';
import type { Prefab } from '../../assets/prefabs/prefabDef';
import type { PrefabAssets } from '../../assets/prefabs/prefabAssets';

export function capturePrefabFromWorld(
  prefabs: PrefabAssets,
  sampler: RegionSampler,
  region: WorldRegion,
): Prefab {
  return prefabs.insert(prefabFromWorldRegion(sampler, region, capturedName(region)));
}

function capturedName(region: WorldRegion): string {
  const { width, depth } = regionSize(region);
  return `capture ${width}×${depth}`;
}

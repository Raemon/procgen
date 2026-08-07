import { hashString } from '../../random/hashString';
import type { Prefab } from '../../prefabs/prefabDef';
import { rotatedAnchorX, rotatedAnchorY, normalizedQuarterTurns } from '../../prefabs/prefabRotation';
import { RANDOM_ROTATION } from '../display/displayBinding';

export interface PrefabPlacement {
  x: number;
  y: number;
  prefabId: number;
  rotation: number;
}

export interface PlacedPrefab {
  prefab: Prefab;
  turns: number;
  originX: number;
  originY: number;
}

export function placedPrefabOf(prefab: Prefab, placement: PrefabPlacement): PlacedPrefab {
  const turns = quarterTurnsFor(placement);
  return {
    prefab,
    turns,
    originX: placement.x - rotatedAnchorX(prefab, turns),
    originY: placement.y - rotatedAnchorY(prefab, turns),
  };
}

function quarterTurnsFor(placement: PrefabPlacement): number {
  if (placement.rotation !== RANDOM_ROTATION) return normalizedQuarterTurns(placement.rotation);
  return hashString(`prefab-turn:${placement.prefabId}:${placement.x},${placement.y}`) % 4;
}

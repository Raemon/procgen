import type * as THREE from 'three';
import { hashString } from '@/features/asset-library/worlds/random/hashString';

export const COPLANAR_LANES = 32;

const LAYER_BANDS = {
  terrainOverview: 1,
  terrain: 0,
  marker: -1,
  item: -2,
  character: -3,
} as const;

export type CoplanarLayer = keyof typeof LAYER_BANDS;

export function coplanarLane(seed: number | string, lanes = COPLANAR_LANES): number {
  const spread = typeof seed === 'number' ? Math.trunc(seed) : hashString(seed);
  return ((spread % lanes) + lanes) % lanes;
}

export function coplanarPullOf(layer: CoplanarLayer, laneSeed: number | string = 0): number {
  return LAYER_BANDS[layer] * COPLANAR_LANES - coplanarLane(laneSeed);
}

export function pullTowardCamera(
  materials: THREE.Material | THREE.Material[],
  pull: number,
): void {
  const pulledMaterials = Array.isArray(materials) ? materials : [materials];
  for (const material of pulledMaterials) {
    material.polygonOffset = pull !== 0;
    material.polygonOffsetFactor = pull / COPLANAR_LANES;
    material.polygonOffsetUnits = pull;
  }
}

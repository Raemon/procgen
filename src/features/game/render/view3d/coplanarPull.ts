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

export function coplanarLane(seed: number | string): number {
  const spread = typeof seed === 'number' ? Math.trunc(seed) : hashString(seed);
  return ((spread % COPLANAR_LANES) + COPLANAR_LANES) % COPLANAR_LANES;
}

export function coplanarPullOf(layer: CoplanarLayer, lane = 0): number {
  return LAYER_BANDS[layer] * COPLANAR_LANES - lane;
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

const laneSubjects = new WeakMap<object, number>();
let nextLaneSubject = 1;

export function laneSubjectOf(subject: object | null): number {
  if (subject === null) return 0;
  const known = laneSubjects.get(subject);
  if (known !== undefined) return known;
  laneSubjects.set(subject, nextLaneSubject);
  return nextLaneSubject++;
}

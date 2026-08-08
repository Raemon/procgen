import * as THREE from 'three';
import { QuadBuffer, type Quad } from './quadBuffer';
import { rememberedSharedGeometry } from './sharedGeometryCache';

const EAST_MATERIAL = 0;
const SOUTH_MATERIAL = 4;
const HALF = 0.5;
const UNTINTED = new THREE.Color('#ffffff');
const CORNER_UVS = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
] as const;

export function sharedCrossedQuadGeometry(): THREE.BufferGeometry {
  return rememberedSharedGeometry('crossedQuads', crossedQuadGeometry);
}

function crossedQuadGeometry(): THREE.BufferGeometry {
  const quads = new QuadBuffer();
  quads.push(quadSpanningX());
  quads.closeGroup(SOUTH_MATERIAL);
  quads.push(quadSpanningZ());
  quads.closeGroup(EAST_MATERIAL);
  return quads.geometry();
}

function quadSpanningX(): Quad {
  return {
    corners: [
      [-HALF, -HALF, 0],
      [HALF, -HALF, 0],
      [HALF, HALF, 0],
      [-HALF, HALF, 0],
    ],
    normal: [0, 0, 1],
    uvs: CORNER_UVS,
    color: UNTINTED,
  };
}

function quadSpanningZ(): Quad {
  return {
    corners: [
      [0, -HALF, HALF],
      [0, -HALF, -HALF],
      [0, HALF, -HALF],
      [0, HALF, HALF],
    ],
    normal: [1, 0, 0],
    uvs: CORNER_UVS,
    color: UNTINTED,
  };
}

import * as THREE from 'three';
import type { OccluderBox } from './culling/occluderBox';
import type { PlacementPosition, PlacementScale } from './instancedTileMesh';
import { shapeFillsCell, type TileShapeKind } from '@/features/asset-library/tiles/tileShapeKind';
import { sharedCrossedQuadGeometry } from './crossedQuadGeometry';
import { sharedTileBoxGeometry } from './sharedTileGeometries';
import { shapedTileGeometry } from './shapedTileGeometries';
import type { TilePlacement } from './tilePlacements';

export const GROUND_DEPTH = 3;
export const WATER_DROP = 0.22;
export const BLOCK_LAYER_HEIGHT = 1;

const MARKER_HEIGHT = 0.7;
const MARKER_WIDTH = 0.48;
const BLOCK_SIDE = 0.95;

export interface TileShape {
  geometry(faces: number): THREE.BufferGeometry;
  positionOf: PlacementPosition;
  scaleOf?: PlacementScale;
  occluderBoxOf?: (placement: TilePlacement) => OccluderBox;
  drawnFromBothSides?: boolean;
}

export function ceilingShape(): TileShape {
  return cubeShape(1);
}

export function voxelShape(): TileShape {
  return cubeShape(1);
}

export function shapedShape(kind: TileShapeKind, facing: number): TileShape {
  if (shapeFillsCell(kind)) return cubeShape(1);
  return {
    geometry: (faces) => shapedTileGeometry(kind, facing, faces),
    positionOf: (p) => [p.x + 0.5, p.elevation + BLOCK_LAYER_HEIGHT / 2, p.y + 0.5],
  };
}

export function blockShape(): TileShape {
  return cubeShape(BLOCK_SIDE);
}

export function floorShape(): TileShape {
  return {
    geometry: (faces) => sharedTileBoxGeometry(1, GROUND_DEPTH, 1, faces),
    positionOf: (p) => [p.x + 0.5, floorTopOf(p) - GROUND_DEPTH / 2, p.y + 0.5],
    occluderBoxOf: (p) => ({ bottom: floorTopOf(p) - GROUND_DEPTH, top: floorTopOf(p), width: 1 }),
  };
}

export function markerShape(): TileShape {
  return {
    geometry: (faces) => sharedTileBoxGeometry(MARKER_WIDTH, MARKER_HEIGHT, MARKER_WIDTH, faces),
    positionOf: (p) => [p.x + 0.5, p.elevation + MARKER_HEIGHT / 2, p.y + 0.5],
  };
}

export function standingFixtureShape(): TileShape {
  return {
    geometry: (faces) => sharedTileBoxGeometry(1, 1, 1, faces),
    positionOf: (p) => [p.x + 0.5, p.elevation + p.height / 2, p.y + 0.5],
    scaleOf: (p) => [1, p.height, 1],
  };
}

export function billboardShape(): TileShape {
  return {
    geometry: () => sharedCrossedQuadGeometry(),
    positionOf: (p) => [p.x + 0.5, p.elevation + p.height / 2, p.y + 0.5],
    scaleOf: (p) => [p.height, p.height, p.height],
    drawnFromBothSides: true,
  };
}

function cubeShape(side: number): TileShape {
  return {
    geometry: (faces) => sharedTileBoxGeometry(side, BLOCK_LAYER_HEIGHT, side, faces),
    positionOf: (p) => [p.x + 0.5, p.elevation + BLOCK_LAYER_HEIGHT / 2, p.y + 0.5],
    occluderBoxOf: (p) => ({ bottom: p.elevation, top: p.elevation + BLOCK_LAYER_HEIGHT, width: side }),
  };
}

function floorTopOf(placement: TilePlacement): number {
  return placement.elevation - (placement.sunkenAsWater ? WATER_DROP : 0);
}

import type * as THREE from 'three';
import { shapeFillsCell, type TileShapeKind } from '@/features/asset-library/tiles/tileShapeKind';
import { rememberedSharedGeometry } from './sharedGeometryCache';
import { sharedTileBoxGeometry } from './sharedTileGeometries';
import { addBoxToFaceBuckets } from './shaped/boxPartBuckets';
import { emptyFaceBuckets, geometryOfFaceBuckets } from './shaped/faceBuckets';
import { addRampWedgeToFaceBuckets } from './shaped/rampWedgeBuckets';
import { boxPartsOfShape, wallBoxParts } from './shaped/shapedTileBoxParts';

const QUARTER_TURN = Math.PI / 2;

export function shapedTileGeometry(
  shape: TileShapeKind,
  facing: number,
  faces: number,
): THREE.BufferGeometry {
  if (shapeFillsCell(shape)) return sharedTileBoxGeometry(1, 1, 1, faces);
  return rememberedSharedGeometry(`shaped:${shape}:${facing}:${faces}`, () =>
    shape === 'wall'
      ? wallGeometryOfConnections(facing, faces)
      : turnedToFacing(unturnedShapeGeometry(shape, faces), facing),
  );
}

function wallGeometryOfConnections(connections: number, faces: number): THREE.BufferGeometry {
  const buckets = emptyFaceBuckets();
  for (const part of wallBoxParts(connections)) addBoxToFaceBuckets(buckets, part);
  return geometryOfFaceBuckets(buckets, faces);
}

function unturnedShapeGeometry(shape: TileShapeKind, faces: number): THREE.BufferGeometry {
  const buckets = emptyFaceBuckets();
  if (shape === 'ramp') addRampWedgeToFaceBuckets(buckets);
  for (const part of boxPartsOfShape(shape)) addBoxToFaceBuckets(buckets, part);
  return geometryOfFaceBuckets(buckets, faces);
}

function turnedToFacing(
  geometry: THREE.BufferGeometry,
  facing: number,
): THREE.BufferGeometry {
  geometry.rotateY(-facing * QUARTER_TURN);
  return geometry;
}

import { CELLS_PER_CHUNK } from '../chunk';

export const EMPTY_TILE = -1;

export type ValueKind = 'field' | 'tiles' | 'points';

export interface WorldPoint {
  x: number;
  y: number;
  tag: string;
}

export type FieldChunk = Float32Array;
export type TilesChunk = Int32Array;
export type PointsChunk = WorldPoint[];

export type ChunkValue =
  | { kind: 'field'; field: FieldChunk }
  | { kind: 'tiles'; tiles: TilesChunk }
  | { kind: 'points'; points: PointsChunk };

export function newFieldChunk(): FieldChunk {
  return new Float32Array(CELLS_PER_CHUNK);
}

export function newTilesChunk(): TilesChunk {
  return new Int32Array(CELLS_PER_CHUNK).fill(EMPTY_TILE);
}

export function fieldValue(field: FieldChunk): ChunkValue {
  return { kind: 'field', field };
}

export function tilesValue(tiles: TilesChunk): ChunkValue {
  return { kind: 'tiles', tiles };
}

export function pointsValue(points: PointsChunk): ChunkValue {
  return { kind: 'points', points };
}

export function emptyValueOfKind(kind: ValueKind): ChunkValue {
  if (kind === 'field') return fieldValue(newFieldChunk());
  if (kind === 'tiles') return tilesValue(newTilesChunk());
  return pointsValue([]);
}

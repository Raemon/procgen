import type { ChunkValue, FieldChunk, PointsChunk, TilesChunk } from './chunkValues';

export function asField(value: ChunkValue | null): FieldChunk | null {
  return value?.kind === 'field' ? value.field : null;
}

export function asTiles(value: ChunkValue | null): TilesChunk | null {
  return value?.kind === 'tiles' ? value.tiles : null;
}

export function asPoints(value: ChunkValue | null): PointsChunk | null {
  return value?.kind === 'points' ? value.points : null;
}

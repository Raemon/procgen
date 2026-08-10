import { hashString } from '../random/hashString';
import { labelSeed } from '../random/labelSeed';
import { mulberry32 } from '../random/mulberry32';
import { hashLatticePoint } from '../noise/hashLatticePoint';
import { CHUNK_SIZE, chunkOrigin } from '../chunk';
import { FINE_STRIDE } from '../cellStride';
import type { ChunkGenCtx, ParamValue } from '../nodeType';
import { newFieldChunk, newTilesChunk, type ChunkValue } from '../values/chunkValues';
import { asField, asPoints, asTiles } from '../values/valueAccess';

export type InputResolver = (
  name: string,
  chunkX: number,
  chunkY: number,
  stride: number,
) => ChunkValue | null;
export type RegionMemo = <Value>(key: string, compute: () => Value) => Value;

export interface GenCtxArgs {
  seed: number;
  time: number;
  nodeId: string;
  params: Record<string, ParamValue>;
  chunkX: number;
  chunkY: number;
  stride: number;
  resolveInput: InputResolver;
  memo: RegionMemo;
}

export function createChunkGenCtx(args: GenCtxArgs): ChunkGenCtx {
  const { seed, time, nodeId, params, chunkX, chunkY, stride, resolveInput, memo } = args;
  const labelSeeds = new Map<string, number>();
  const labelSeed = (label: string): number => seedForLabel(labelSeeds, seed, nodeId, label);
  const input = (name: string): ChunkValue | null => resolveInput(name, chunkX, chunkY, stride);
  const rngAt = (gridX: number, gridY: number, label: string) =>
    mulberry32(hashString(streamKey(seed, nodeId, gridX, gridY, label, stride)));
  return {
    nodeId,
    time,
    chunkX,
    chunkY,
    originX: chunkOrigin(chunkX),
    originY: chunkOrigin(chunkY),
    size: CHUNK_SIZE,
    stride,
    params,
    rng: (label) => rngAt(chunkX, chunkY, label),
    rngAt,
    hashSeed: labelSeed,
    hash01: (worldX, worldY, label) => hashLatticePoint(worldX, worldY, labelSeed(label)),
    input,
    inputAt: (name, atChunkX, atChunkY) => resolveInput(name, atChunkX, atChunkY, stride),
    inputAtStride: (name, atChunkX, atChunkY, atStride) =>
      resolveInput(name, atChunkX, atChunkY, atStride),
    fieldInput: (name) => asField(input(name)),
    tilesInput: (name) => asTiles(input(name)),
    pointsInput: (name) => asPoints(input(name)),
    newField: newFieldChunk,
    newTiles: newTilesChunk,
    memo,
  };
}

function streamKey(
  seed: number,
  nodeId: string,
  gridX: number,
  gridY: number,
  label: string,
  stride: number,
): string {
  const perCell = `${seed}:${nodeId}:${gridX},${gridY}:${label}`;
  return stride === FINE_STRIDE ? perCell : `${perCell}:stride${stride}`;
}

function seedForLabel(
  cache: Map<string, number>,
  seed: number,
  nodeId: string,
  label: string,
): number {
  const cached = cache.get(label);
  if (cached !== undefined) return cached;
  const computed = labelSeed(seed, nodeId, label);
  cache.set(label, computed);
  return computed;
}

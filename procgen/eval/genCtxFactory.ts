import { hashString } from '../random/hashString';
import { labelSeed } from '../random/labelSeed';
import { mulberry32 } from '../random/mulberry32';
import { hashLatticePoint } from '../noise/hashLatticePoint';
import { CHUNK_SIZE, chunkOrigin } from '../chunk';
import type { ChunkGenCtx, ParamValue } from '../nodeType';
import { newFieldChunk, newTilesChunk, type ChunkValue } from '../values/chunkValues';
import { asField, asPoints, asTiles } from '../values/valueAccess';

export type InputResolver = (name: string, chunkX: number, chunkY: number) => ChunkValue | null;
export type RegionMemo = <Value>(key: string, compute: () => Value) => Value;

export interface GenCtxArgs {
  seed: number;
  nodeId: string;
  params: Record<string, ParamValue>;
  chunkX: number;
  chunkY: number;
  resolveInput: InputResolver;
  memo: RegionMemo;
}

export function createChunkGenCtx(args: GenCtxArgs): ChunkGenCtx {
  const { seed, nodeId, params, chunkX, chunkY, resolveInput, memo } = args;
  const labelSeeds = new Map<string, number>();
  const labelSeed = (label: string): number => seedForLabel(labelSeeds, seed, nodeId, label);
  const input = (name: string): ChunkValue | null => resolveInput(name, chunkX, chunkY);
  const rngAt = (gridX: number, gridY: number, label: string) =>
    mulberry32(hashString(`${seed}:${nodeId}:${gridX},${gridY}:${label}`));
  return {
    nodeId,
    chunkX,
    chunkY,
    originX: chunkOrigin(chunkX),
    originY: chunkOrigin(chunkY),
    size: CHUNK_SIZE,
    params,
    rng: (label) => rngAt(chunkX, chunkY, label),
    rngAt,
    hashSeed: labelSeed,
    hash01: (worldX, worldY, label) => hashLatticePoint(worldX, worldY, labelSeed(label)),
    input,
    inputAt: (name, atChunkX, atChunkY) => resolveInput(name, atChunkX, atChunkY),
    fieldInput: (name) => asField(input(name)),
    tilesInput: (name) => asTiles(input(name)),
    pointsInput: (name) => asPoints(input(name)),
    newField: newFieldChunk,
    newTiles: newTilesChunk,
    memo,
  };
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

import { chunkOrigin, CHUNK_SIZE } from '../../chunk';
import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { fieldValue, type ChunkValue } from '../../values/chunkValues';
import {
  clampedWindowRadius,
  gatherFieldWindowRect,
  windowIndexAt,
  type FieldWindow,
} from '../../values/fieldWindow';
import { chamferDistanceFromSeeds } from './chamferDistance';

const SHARED_WINDOW_CHUNKS = 4;

registerNodeType({
  type: 'coastDistance',
  title: 'distance to coast',
  category: 'water',
  description:
    'Returns how far each cell is from the shoreline, as one field that runs from 0 far out at sea, through 0.5 exactly on the coast, to 1 deep inland.',
  whenToUse:
    'Whenever a band should follow the shape of the coast rather than a height contour: beaches of an even width, a continental shelf that shallows toward land, sea ice or reefs, or drier interiors far from any ocean.',
  inputs: {
    elevation: { kind: 'field', label: 'elevation', help: 'The terrain whose shoreline is measured, read across chunk edges out to the range.' },
  },
  params: {
    seaLevel: {
      kind: 'number',
      label: 'sea level',
      help: 'Cells below this count as sea. The boundary between sea and land is the coastline being measured.',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.5,
    },
    range: {
      kind: 'int',
      label: 'range',
      help: 'The distance in tiles that maps to fully inland or fully offshore. It also sets how far past the shared 4x4-chunk window the coastline is searched for, so it is the cost knob.',
      min: 4,
      max: 128,
      default: 32,
    },
  },
  output: 'field',
  generateChunk: coastDistanceChunk,
});

function coastDistanceChunk(ctx: ChunkGenCtx): ChunkValue {
  const out = ctx.newField();
  const range = rangeInCells(ctx);
  const shared = sharedRegionDistances(ctx);
  if (!shared) return fieldValue(out);
  writeSignedDistance(
    ctx,
    shared.window,
    shared.toSea,
    shared.toLand,
    ctx.params.seaLevel as number,
    range,
    out,
  );
  return fieldValue(out);
}

interface RegionDistances {
  window: FieldWindow;
  toSea: Float32Array;
  toLand: Float32Array;
}

function sharedRegionDistances(ctx: ChunkGenCtx): RegionDistances | null {
  const regionChunkX = alignedRegionStart(ctx.chunkX);
  const regionChunkY = alignedRegionStart(ctx.chunkY);
  return ctx.memo(`coast|${regionChunkX},${regionChunkY}`, () =>
    computeRegionDistances(ctx, regionChunkX, regionChunkY),
  );
}

function rangeInCells(ctx: ChunkGenCtx): number {
  return clampedWindowRadius(Math.max(1, Math.round(ctx.params.range as number)));
}

function alignedRegionStart(chunkCoord: number): number {
  return Math.floor(chunkCoord / SHARED_WINDOW_CHUNKS) * SHARED_WINDOW_CHUNKS;
}

function computeRegionDistances(
  ctx: ChunkGenCtx,
  regionChunkX: number,
  regionChunkY: number,
): RegionDistances | null {
  const range = rangeInCells(ctx);
  const regionSpan = SHARED_WINDOW_CHUNKS * CHUNK_SIZE;
  const window = gatherFieldWindowRect(
    ctx,
    'elevation',
    chunkOrigin(regionChunkX) - range,
    chunkOrigin(regionChunkY) - range,
    regionSpan + range * 2,
    regionSpan + range * 2,
  );
  if (!window) return null;
  const seaLevel = ctx.params.seaLevel as number;
  return {
    window,
    toSea: distanceToCells(window, (height) => height < seaLevel),
    toLand: distanceToCells(window, (height) => height >= seaLevel),
  };
}

function distanceToCells(window: FieldWindow, isSeed: (height: number) => boolean): Float32Array {
  const seeds = new Uint8Array(window.data.length);
  for (let i = 0; i < seeds.length; i++) seeds[i] = isSeed(window.data[i]!) ? 1 : 0;
  return chamferDistanceFromSeeds(seeds, window.width, window.height);
}

function writeSignedDistance(
  ctx: ChunkGenCtx,
  window: FieldWindow,
  toSea: Float32Array,
  toLand: Float32Array,
  seaLevel: number,
  range: number,
  out: Float32Array,
): void {
  for (let i = 0; i < out.length; i++) {
    const index = windowIndexAt(window, ctx.originX + (i % ctx.size), ctx.originY + Math.floor(i / ctx.size));
    const onLand = window.data[index]! >= seaLevel;
    const distance = Math.min(1, (onLand ? toSea[index]! : toLand[index]!) / range);
    out[i] = onLand ? 0.5 + 0.5 * distance : 0.5 - 0.5 * distance;
  }
}

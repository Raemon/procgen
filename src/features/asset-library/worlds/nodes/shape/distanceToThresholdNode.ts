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
  type: 'distanceToThreshold',
  title: 'distance to threshold',
  category: 'basics',
  description:
    'Draws the contour where a field crosses one level and measures how far every cell is from it, as a single field that runs from 0 a full range below the level, through 0.5 exactly on the contour, to 1 a full range above it.',
  whenToUse:
    'Whenever a band should follow the shape of a boundary rather than the value that made it: beaches of an even width along a coastline, a rind of rubble around a lava flow, the skirt of a forest, or how deep inside a region a cell sits. Feed the result to a shape node when you want a cut or a rise whose width is measured in tiles.',
  inputs: {
    elevation: { kind: 'field', expects: 'unit', label: 'source', help: 'The field whose level set is measured, read across chunk edges out to the range.' },
  },
  params: {
    level: {
      kind: 'number',
      label: 'level',
      help: 'The value whose contour is measured. Cells below it read as outside, cells at or above it as inside — for terrain and a sea level, that is sea and land.',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.5,
    },
    range: {
      kind: 'int',
      label: 'range',
      help: 'The distance in tiles that maps to fully inside or fully outside. It also sets how far past the shared 4x4-chunk window the contour is searched for, so it is the cost knob.',
      min: 4,
      max: 128,
      default: 32,
    },
  },
  output: 'field',
  outputSemantic: 'distance',
  generateChunk: distanceToThresholdChunk,
});

function distanceToThresholdChunk(ctx: ChunkGenCtx): ChunkValue {
  const out = ctx.newField();
  const range = rangeInCells(ctx);
  const shared = sharedRegionDistances(ctx);
  if (!shared) return fieldValue(out);
  writeSignedDistance(ctx, shared, ctx.params.level as number, range, out);
  return fieldValue(out);
}

interface RegionDistances {
  window: FieldWindow;
  toOutside: Float32Array;
  toInside: Float32Array;
}

function sharedRegionDistances(ctx: ChunkGenCtx): RegionDistances | null {
  const regionChunkX = alignedRegionStart(ctx.chunkX);
  const regionChunkY = alignedRegionStart(ctx.chunkY);
  return ctx.memo(`levelSet|${regionChunkX},${regionChunkY}`, () =>
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
  const level = ctx.params.level as number;
  return {
    window,
    toOutside: distanceToCells(window, (value) => value < level),
    toInside: distanceToCells(window, (value) => value >= level),
  };
}

function distanceToCells(window: FieldWindow, isSeed: (value: number) => boolean): Float32Array {
  const seeds = new Uint8Array(window.data.length);
  for (let i = 0; i < seeds.length; i++) seeds[i] = isSeed(window.data[i]!) ? 1 : 0;
  return chamferDistanceFromSeeds(seeds, window.width, window.height);
}

function writeSignedDistance(
  ctx: ChunkGenCtx,
  distances: RegionDistances,
  level: number,
  range: number,
  out: Float32Array,
): void {
  const window = distances.window;
  for (let i = 0; i < out.length; i++) {
    const index = windowIndexAt(window, ctx.originX + (i % ctx.size), ctx.originY + Math.floor(i / ctx.size));
    const inside = window.data[index]! >= level;
    const reach = inside ? distances.toOutside[index]! : distances.toInside[index]!;
    const distance = Math.min(1, reach / range);
    out[i] = inside ? 0.5 + 0.5 * distance : 0.5 - 0.5 * distance;
  }
}

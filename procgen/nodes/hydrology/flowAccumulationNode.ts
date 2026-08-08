import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { chunkOrigin, CHUNK_SIZE } from '../../chunk';
import { cellsSpanningTiles } from '../../cellStride';
import { fieldValue, type ChunkValue } from '../../values/chunkValues';
import {
  clampedWindowRadius,
  gatherFieldWindowRect,
  windowIndexAt,
  type FieldWindow,
} from '../../values/fieldWindow';
import { accumulatedFlow } from './accumulateFlow';
import { drainableSurface } from './drainableSurface';

const SHARED_WINDOW_CHUNKS = 4;

registerNodeType({
  type: 'flowAccumulation',
  title: 'flow accumulation',
  category: 'water',
  description:
    'Sends one unit of rain down the steepest path from every cell in a window around the chunk and reports how much water passes through each cell — the drainage area that decides where rivers are and how big they get.',
  whenToUse:
    'The realistic way to make rivers. Instead of tracing a handful of springs, every cell drains, so watercourses appear where the terrain actually collects water, merge into trunks, and grow downstream. Threshold it into tiles, or subtract it from the terrain to carve valleys.',
  inputs: {
    elevation: { kind: 'field', label: 'elevation', help: 'The terrain water runs down. Read across chunk edges out to the window radius.' },
  },
  params: {
    seaLevel: {
      kind: 'number',
      label: 'sea level',
      help: 'Water that reaches this height has arrived at the ocean and stops accumulating, so the sea floor is not covered in rivers.',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.5,
    },
    catchmentScale: {
      kind: 'int',
      label: 'full-flow catchment',
      help: 'The drainage area, in tiles, that counts as a full-strength river (output 1). Smaller values make more of the network read as major rivers.',
      min: 50,
      max: 20000,
      default: 3000,
    },
    convergence: {
      kind: 'number',
      label: 'convergence',
      help: 'How sharply water prefers the steepest way down. Low values let a cell feed several neighbours at once, which braids channels and spreads fans; high values drive nearly everything down one path, which keeps trunks crisp.',
      min: 1,
      max: 8,
      step: 0.5,
      default: 4,
    },
    channelizeAbove: {
      kind: 'int',
      label: 'channel forms above',
      help: 'The drainage area, in tiles, at which water stops spreading over the hillside and commits to a single channel. Below it the flow fans out the way runoff really does; above it the watercourse stays one coherent thread.',
      min: 1,
      max: 2000,
      default: 20,
    },
    fillPits: {
      kind: 'toggle',
      label: 'fill pits first',
      help: 'Flood closed hollows before routing so flow never dead-ends in a noise pit. Turn off only if the input is already a drainable surface.',
      default: 1,
    },
    windowRadius: {
      kind: 'int',
      label: 'window radius',
      help: 'How far upstream to look for water, in tiles, beyond the shared 4x4-chunk routing region. This caps how large a catchment can be seen, and is the main cost knob.',
      min: 16,
      max: 128,
      default: 40,
    },
  },
  output: 'field',
  generateChunk: flowAccumulationChunk,
});

function flowAccumulationChunk(ctx: ChunkGenCtx): ChunkValue {
  const out = ctx.newField();
  const shared = sharedRegionFlow(ctx);
  if (!shared) return fieldValue(out);
  writeNormalizedFlow(ctx, shared.window, shared.flow, out);
  return fieldValue(out);
}

interface RegionFlow {
  window: FieldWindow;
  flow: Float32Array;
}

function sharedRegionFlow(ctx: ChunkGenCtx): RegionFlow | null {
  const regionChunkX = alignedRegionStart(ctx.chunkX);
  const regionChunkY = alignedRegionStart(ctx.chunkY);
  return ctx.memo(`flow|${regionChunkX},${regionChunkY}`, () =>
    computeRegionFlow(ctx, regionChunkX, regionChunkY),
  );
}

function channelStartInCells(ctx: ChunkGenCtx): number {
  return Math.max(1, (ctx.params.channelizeAbove as number) / (ctx.stride * ctx.stride));
}

function catchmentInCells(ctx: ChunkGenCtx): number {
  return Math.max(1, (ctx.params.catchmentScale as number) / (ctx.stride * ctx.stride));
}

function alignedRegionStart(chunkCoord: number): number {
  return Math.floor(chunkCoord / SHARED_WINDOW_CHUNKS) * SHARED_WINDOW_CHUNKS;
}

function computeRegionFlow(
  ctx: ChunkGenCtx,
  regionChunkX: number,
  regionChunkY: number,
): RegionFlow | null {
  const radius = clampedWindowRadius(cellsSpanningTiles(ctx.params.windowRadius as number, ctx.stride));
  const regionSpan = SHARED_WINDOW_CHUNKS * CHUNK_SIZE;
  const window = gatherFieldWindowRect(
    ctx,
    'elevation',
    chunkOrigin(regionChunkX) - radius,
    chunkOrigin(regionChunkY) - radius,
    regionSpan + radius * 2,
    regionSpan + radius * 2,
  );
  if (!window) return null;
  const seaLevel = ctx.params.seaLevel as number;
  return {
    window,
    flow: accumulatedFlow(routingSurface(ctx, window, seaLevel), window, {
      seaLevel,
      convergence: ctx.params.convergence as number,
      channelizeAbove: channelStartInCells(ctx),
    }),
  };
}

function routingSurface(ctx: ChunkGenCtx, window: FieldWindow, seaLevel: number): Float32Array {
  if (ctx.params.fillPits !== 1) return window.data;
  return drainableSurface(window, { seaLevel, maxFill: 1 });
}

function writeNormalizedFlow(
  ctx: ChunkGenCtx,
  window: FieldWindow,
  flow: Float32Array,
  out: Float32Array,
): void {
  const fullFlow = Math.log(1 + catchmentInCells(ctx));
  for (let y = 0; y < ctx.size; y++) {
    for (let x = 0; x < ctx.size; x++) {
      const carried = flow[windowIndexAt(window, ctx.originX + x, ctx.originY + y)]!;
      out[y * ctx.size + x] = Math.min(1, Math.log(1 + carried) / fullFlow);
    }
  }
}

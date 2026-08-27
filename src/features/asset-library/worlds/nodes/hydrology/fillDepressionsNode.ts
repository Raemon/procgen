import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { fieldValue, type ChunkValue } from '../../values/chunkValues';
import { gatherFieldWindow, windowIndexAt, type FieldWindow } from '../../values/fieldWindow';
import { drainableSurface } from './drainableSurface';

registerNodeType({
  type: 'fillDepressions',
  title: 'fill depressions',
  category: 'water',
  description:
    'Floods every pit in the terrain up to the lowest point it could spill over, returning a surface on which water can always run downhill to the sea.',
  whenToUse:
    'Before flow accumulation. Raw noise is full of closed hollows, so downhill tracing dies a few tiles from its spring; filling them first is what turns disconnected trickles into a branching river network. Subtract this from the original terrain to find the lakes it implies.',
  inputs: {
    elevation: { kind: 'field', expects: 'elevation', label: 'elevation', help: 'The terrain to make drainable. Read across chunk edges within the window radius.' },
  },
  params: {
    seaLevel: {
      kind: 'number',
      label: 'sea level',
      help: 'Anything at or below this drains away freely, so basins spill toward the ocean rather than filling to the window edge.',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.5,
    },
    maxFill: {
      kind: 'number',
      label: 'max fill depth',
      help: 'How deep a hollow may be flooded. Low values leave big basins unfilled as endorheic dead ends; high values guarantee an outlet.',
      min: 0,
      max: 0.5,
      step: 0.01,
      default: 0.2,
    },
    windowRadius: {
      kind: 'int',
      label: 'window radius',
      help: 'How far beyond the chunk the flood looks for a spill point, in tiles. Bigger is more correct and slower; basins wider than this drain at the window edge.',
      min: 16,
      max: 128,
      default: 64,
    },
  },
  output: 'field',
  outputSemantic: 'elevation',
  generateChunk: fillDepressionsChunk,
});

function fillDepressionsChunk(ctx: ChunkGenCtx): ChunkValue {
  const out = ctx.newField();
  const window = gatherFieldWindow(
    ctx,
    'elevation',
    Math.max(1, Math.round(ctx.params.windowRadius as number)),
  );
  if (!window) return fieldValue(out);
  const filled = drainableSurface(window, {
    seaLevel: ctx.params.seaLevel as number,
    maxFill: ctx.params.maxFill as number,
  });
  copyChunkOut(ctx, window, filled, out);
  return fieldValue(out);
}

function copyChunkOut(
  ctx: ChunkGenCtx,
  window: FieldWindow,
  filled: Float32Array,
  out: Float32Array,
): void {
  for (let y = 0; y < ctx.size; y++) {
    for (let x = 0; x < ctx.size; x++) {
      out[y * ctx.size + x] = filled[windowIndexAt(window, ctx.originX + x, ctx.originY + y)]!;
    }
  }
}

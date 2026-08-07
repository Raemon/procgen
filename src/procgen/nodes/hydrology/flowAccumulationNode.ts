import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { fieldValue, type ChunkValue } from '../../values/chunkValues';
import { gatherFieldWindow, windowIndexAt, type FieldWindow } from '../../values/fieldWindow';
import { accumulatedFlow } from './accumulateFlow';
import { drainableSurface } from './drainableSurface';

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
    fillPits: {
      kind: 'toggle',
      label: 'fill pits first',
      help: 'Flood closed hollows before routing so flow never dead-ends in a noise pit. Turn off only if the input is already a drainable surface.',
      default: 1,
    },
    windowRadius: {
      kind: 'int',
      label: 'window radius',
      help: 'How far upstream the chunk looks for water, in tiles. This caps how large a catchment can be seen, and is the main cost knob.',
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
  const window = gatherFieldWindow(ctx, 'elevation', ctx.params.windowRadius as number);
  if (!window) return fieldValue(out);
  const seaLevel = ctx.params.seaLevel as number;
  const flow = accumulatedFlow(routingSurface(ctx, window, seaLevel), window, seaLevel);
  writeNormalizedFlow(ctx, window, flow, out);
  return fieldValue(out);
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
  const fullFlow = Math.log(1 + (ctx.params.catchmentScale as number));
  for (let y = 0; y < ctx.size; y++) {
    for (let x = 0; x < ctx.size; x++) {
      const carried = flow[windowIndexAt(window, ctx.originX + x, ctx.originY + y)]!;
      out[y * ctx.size + x] = Math.min(1, Math.log(1 + carried) / fullFlow);
    }
  }
}

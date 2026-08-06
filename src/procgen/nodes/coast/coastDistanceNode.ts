import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { fieldValue, type ChunkValue } from '../../values/chunkValues';
import { gatherFieldWindow, windowIndexAt, type FieldWindow } from '../../values/fieldWindow';
import { chamferDistanceFromSeeds } from './chamferDistance';

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
      help: 'The distance in tiles that maps to fully inland or fully offshore. It also sets how far past the chunk the coastline is searched for, so it is the cost knob.',
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
  const range = ctx.params.range as number;
  const window = gatherFieldWindow(ctx, 'elevation', range);
  if (!window) return fieldValue(out);
  const seaLevel = ctx.params.seaLevel as number;
  const toSea = distanceToCells(window, (height) => height < seaLevel);
  const toLand = distanceToCells(window, (height) => height >= seaLevel);
  writeSignedDistance(ctx, window, toSea, toLand, seaLevel, range, out);
  return fieldValue(out);
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

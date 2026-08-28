import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { fieldValue, type ChunkValue } from '../../values/chunkValues';

registerNodeType({
  type: 'basinField',
  title: 'basin',
  category: 'terrain',
  description:
    'A bowl sunk around one point: the floor value at the center, rising smoothly to the full height at the rim radius, and flat at full height everywhere beyond.',
  whenToUse:
    'The spine of a climb-out world: bind it to elevation and every uphill step points toward the rim. Blend noise over it for texture, terrace it into ledges, or subtract it from a constant to invert the bowl into a peak or into a mask that fades with distance from the center.',
  inputs: {},
  params: {
    centerX: {
      kind: 'int',
      label: 'center x',
      help: 'World x of the lowest point of the bowl. 0 puts it where players spawn.',
      min: -4096,
      max: 4096,
      default: 0,
    },
    centerY: {
      kind: 'int',
      label: 'center y',
      help: 'World y of the lowest point of the bowl. 0 puts it where players spawn.',
      min: -4096,
      max: 4096,
      default: 0,
    },
    radius: {
      kind: 'int',
      label: 'rim radius',
      help: 'Distance in tiles from the center to the rim, where the bowl reaches full height and the surface begins.',
      min: 32,
      max: 2048,
      default: 384,
    },
    floor: {
      kind: 'number',
      label: 'floor',
      help: 'The value at the very bottom of the bowl. Raise it to leave headroom below the floor for pits and crevasses.',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.1,
    },
  },
  output: 'field',
  generateChunk: basinChunk,
});

function basinChunk(ctx: ChunkGenCtx): ChunkValue {
  const out = ctx.newField();
  const centerX = ctx.params.centerX as number;
  const centerY = ctx.params.centerY as number;
  const radius = Math.max(1, ctx.params.radius as number);
  const floor = ctx.params.floor as number;
  for (let y = 0; y < ctx.size; y++) {
    for (let x = 0; x < ctx.size; x++) {
      const distance = Math.hypot(ctx.originX + x - centerX, ctx.originY + y - centerY);
      const reach = Math.min(1, distance / radius);
      const rise = reach * reach * (3 - 2 * reach);
      out[y * ctx.size + x] = floor + (1 - floor) * rise;
    }
  }
  return fieldValue(out);
}

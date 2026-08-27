import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { pointsValue, type ChunkValue, type PointsChunk } from '../../values/chunkValues';

registerNodeType({
  type: 'scatterPoints',
  title: 'scatter points',
  category: 'basics',
  description:
    'Drops points using a per-cell world-position hash, optionally masked by a field band. The observation legend names them by this node\'s label.',
  whenToUse:
    'Placing things rather than painting terrain: trees, monsters, loot. Wire a terrain field into the mask and set the band so points only land where the terrain suits them.',
  inputs: {
    mask: {
      kind: 'field',
      expects: 'mask',
      label: 'mask',
      help: 'Optional field that gates where points may land via the mask ≥/≤ band. Leave unwired to scatter everywhere.',
      optional: true,
    },
  },
  params: {
    density: {
      kind: 'number',
      label: 'density',
      help: 'Chance per cell (0..1) of dropping a point. 0.05 means roughly one point per 20 eligible cells.',
      min: 0,
      max: 1,
      step: 0.005,
      default: 0.05,
    },
    maskAtLeast: {
      kind: 'number',
      label: 'mask ≥',
      help: 'With a mask wired, only cells whose mask value is at least this can receive points.',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0,
    },
    maskAtMost: {
      kind: 'number',
      label: 'mask ≤',
      help: 'With a mask wired, only cells whose mask value is at most this can receive points.',
      min: 0,
      max: 1,
      step: 0.01,
      default: 1,
    },
  },
  output: 'points',
  pointAttributes: [],
  generateChunk: scatterChunk,
});

function scatterChunk(ctx: ChunkGenCtx): ChunkValue {
  const mask = ctx.fieldInput('mask');
  const points: PointsChunk = [];
  for (let y = 0; y < ctx.size; y++) {
    for (let x = 0; x < ctx.size; x++) {
      if (passesMask(ctx, mask?.[y * ctx.size + x])) collectPoint(ctx, points, x, y);
    }
  }
  return pointsValue(points);
}

function passesMask(ctx: ChunkGenCtx, maskValue: number | undefined): boolean {
  if (maskValue === undefined) return true;
  return maskValue >= (ctx.params.maskAtLeast as number) && maskValue <= (ctx.params.maskAtMost as number);
}

function collectPoint(ctx: ChunkGenCtx, points: PointsChunk, x: number, y: number): void {
  const worldX = ctx.originX + x;
  const worldY = ctx.originY + y;
  if (ctx.hash01(worldX, worldY, 'scatter') < (ctx.params.density as number)) {
    points.push({ x: worldX, y: worldY, tag: ctx.nodeId });
  }
}

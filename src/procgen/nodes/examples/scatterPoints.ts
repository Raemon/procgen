import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { pointsValue, type ChunkValue, type PointsChunk } from '../../values/chunkValues';

registerNodeType({
  type: 'scatterPoints',
  title: 'scatter points',
  category: 'examples',
  description: 'Drops tagged points using a per-cell world-position hash, optionally masked by a field band.',
  inputs: {
    mask: { kind: 'field', label: 'mask', optional: true },
  },
  params: {
    density: { kind: 'number', label: 'density', min: 0, max: 1, step: 0.005, default: 0.05 },
    maskAtLeast: { kind: 'number', label: 'mask ≥', min: 0, max: 1, step: 0.01, default: 0 },
    maskAtMost: { kind: 'number', label: 'mask ≤', min: 0, max: 1, step: 0.01, default: 1 },
    tag: { kind: 'text', label: 'tag', default: 'point' },
  },
  output: 'points',
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
    points.push({ x: worldX, y: worldY, tag: ctx.params.tag as string });
  }
}

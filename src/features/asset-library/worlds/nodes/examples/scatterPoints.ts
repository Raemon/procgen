import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { pointsValue, type ChunkValue, type PointsChunk } from '../../values/chunkValues';
import { ANGLE, SCATTER_ATTRS, STAMP_RADIUS, STAMP_WEIGHT } from '../../values/pointData';

const TAU = Math.PI * 2;

registerNodeType({
  type: 'scatterPoints',
  title: 'scatter points',
  category: 'basics',
  description:
    'Drops points using a per-cell world-position hash, optionally masked by a field band. Every point gets its own radius, weight and angle, drawn from the same hash, so the things stamped on them come out varied instead of identical. The observation legend names them by this node\'s label.',
  whenToUse:
    'Placing things rather than painting terrain: trees, monsters, loot, and the seeds of craters, towers, oases and dunes. Wire a terrain field into the mask and set the band so points only land where the terrain suits them, then read the radius and weight from a stamp or an attribute field downstream.',
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
    radiusMin: {
      kind: 'number',
      label: 'radius ≥',
      help: 'Smallest radius, in tiles, written onto a point. Set both ends the same for a field of identical stamps.',
      min: 0,
      max: 256,
      step: 1,
      default: 4,
    },
    radiusMax: {
      kind: 'number',
      label: 'radius ≤',
      help: 'Largest radius, in tiles, written onto a point. Widening the gap makes a scatter of craters or copses read as a range of sizes rather than a stencil.',
      min: 0,
      max: 256,
      step: 1,
      default: 12,
    },
    weightMin: {
      kind: 'number',
      label: 'weight ≥',
      help: 'Weakest weight (0..1) written onto a point — how much a stamp reading this attribute is worth at its centre.',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0,
    },
    weightMax: {
      kind: 'number',
      label: 'weight ≤',
      help: 'Strongest weight (0..1) written onto a point. Pull the low end up to keep every stamp readable, drop it to let most of them fade into the ground.',
      min: 0,
      max: 1,
      step: 0.01,
      default: 1,
    },
  },
  output: 'points',
  pointAttributes: SCATTER_ATTRS,
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
  if (ctx.hash01(worldX, worldY, 'scatter') >= (ctx.params.density as number)) return;
  points.push({ x: worldX, y: worldY, tag: ctx.nodeId, data: pointDataAt(ctx, worldX, worldY) });
}

function pointDataAt(ctx: ChunkGenCtx, worldX: number, worldY: number): Record<string, number> {
  return {
    [STAMP_RADIUS]: between(ctx, worldX, worldY, 'scatter radius', 'radiusMin', 'radiusMax'),
    [STAMP_WEIGHT]: between(ctx, worldX, worldY, 'scatter weight', 'weightMin', 'weightMax'),
    [ANGLE]: ctx.hash01(worldX, worldY, 'scatter angle') * TAU,
  };
}

function between(
  ctx: ChunkGenCtx,
  worldX: number,
  worldY: number,
  label: string,
  lowParam: string,
  highParam: string,
): number {
  const low = ctx.params[lowParam] as number;
  const high = ctx.params[highParam] as number;
  return low + ctx.hash01(worldX, worldY, label) * (high - low);
}

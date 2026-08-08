import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { pointsValue, type ChunkValue, type PointsChunk } from '../../values/chunkValues';
import { worldFieldReader, type WorldFieldReader } from '../../values/worldInputReaders';

registerNodeType({
  type: 'villageCenters',
  title: 'village centers',
  category: 'settlement',
  description:
    'Founds one village center per neighbourhood of habitable ground: cells inside the mask band become candidates, then a deterministic contest thins them so centers keep their spacing.',
  whenToUse:
    'Villages that answer to the land rather than to a hand-placed marker. Wire in any field — habitability, elevation, distance from a coast — and the centers appear wherever that field sits inside the band you ask for.',
  inputs: {
    mask: {
      kind: 'field',
      label: 'mask',
      help: 'The field that says where people can live. Only cells inside the band below become candidate centers.',
    },
  },
  params: {
    maskAtLeast: {
      kind: 'number',
      label: 'mask ≥',
      help: 'Cells below this are too poor to settle, so no center is founded there.',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.5,
    },
    maskAtMost: {
      kind: 'number',
      label: 'mask ≤',
      help: 'Cells above this are ruled out too, which keeps villages off peaks when the mask is an elevation field.',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.85,
    },
    spacing: {
      kind: 'int',
      label: 'village spacing',
      help: 'Minimum distance in tiles between two village centers. Rivals inside this range are thinned deterministically.',
      min: 16,
      max: 192,
      default: 64,
    },
  },
  output: 'points',
  generateChunk: villageCentersChunk,
});

function villageCentersChunk(ctx: ChunkGenCtx): ChunkValue {
  const points: PointsChunk = [];
  if (!ctx.fieldInput('mask')) return pointsValue(points);
  const site = villageSiteTest(ctx);
  for (let y = 0; y < ctx.size; y++) {
    for (let x = 0; x < ctx.size; x++) {
      collectCenterAt(ctx, site, ctx.originX + x, ctx.originY + y, points);
    }
  }
  return pointsValue(points);
}

function collectCenterAt(
  ctx: ChunkGenCtx,
  site: SiteTest,
  worldX: number,
  worldY: number,
  into: PointsChunk,
): void {
  if (!site(worldX, worldY)) return;
  if (!winsSpacingContest(ctx, site, worldX, worldY)) return;
  into.push({ x: worldX, y: worldY, tag: 'village' });
}

type SiteTest = (worldX: number, worldY: number) => boolean;

function villageSiteTest(ctx: ChunkGenCtx): SiteTest {
  const maskAt = worldFieldReader(ctx, 'mask');
  const spacing = ctx.params.spacing as number;
  return (worldX, worldY) =>
    ctx.hash01(worldX, worldY, 'village candidate') < candidateChance(spacing) &&
    maskAllows(maskAt, ctx, worldX, worldY);
}

function maskAllows(
  maskAt: WorldFieldReader,
  ctx: ChunkGenCtx,
  worldX: number,
  worldY: number,
): boolean {
  const value = maskAt(worldX, worldY);
  if (value === null) return false;
  return value >= (ctx.params.maskAtLeast as number) && value <= (ctx.params.maskAtMost as number);
}

function candidateChance(spacing: number): number {
  return 3 / (spacing * spacing);
}

function winsSpacingContest(
  ctx: ChunkGenCtx,
  site: SiteTest,
  worldX: number,
  worldY: number,
): boolean {
  const spacing = ctx.params.spacing as number;
  const myRank = centerRank(ctx, worldX, worldY);
  for (let dy = -spacing; dy <= spacing; dy++) {
    for (let dx = -spacing; dx <= spacing; dx++) {
      if (rivalOutranks(ctx, site, { worldX, worldY, dx, dy, spacing }, myRank)) return false;
    }
  }
  return true;
}

interface RivalOffset {
  worldX: number;
  worldY: number;
  dx: number;
  dy: number;
  spacing: number;
}

function rivalOutranks(
  ctx: ChunkGenCtx,
  site: SiteTest,
  offset: RivalOffset,
  myRank: number,
): boolean {
  if (offset.dx === 0 && offset.dy === 0) return false;
  if (offset.dx * offset.dx + offset.dy * offset.dy > offset.spacing * offset.spacing) return false;
  const rivalX = offset.worldX + offset.dx;
  const rivalY = offset.worldY + offset.dy;
  if (!site(rivalX, rivalY)) return false;
  return centerRank(ctx, rivalX, rivalY) < myRank;
}

function centerRank(ctx: ChunkGenCtx, worldX: number, worldY: number): number {
  return ctx.hash01(worldX, worldY, 'village rank');
}

import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { PRESENT } from '../../time/worldTime';
import { pointsValue, type ChunkValue, type PointsChunk } from '../../values/chunkValues';
import { BORN } from '../../values/pointData';
import { worldFieldReader, type WorldFieldReader } from '../../values/worldInputReaders';
import { landfallCellsOverlapping, type Landfall } from '../../volcanic/landfallLattice';
import {
  cheapestCostReaching,
  gridIndexOf,
  type CostGrid,
} from '../../volcanic/settlementCost';

export const VILLAGE_TAG = 'village';

const GRID_STEP = 16;
const REGION_CHUNKS = 8;
const GRID_MARGIN_CELLS = 16;

registerNodeType({
  type: 'settlementSpread',
  title: 'settlement spread',
  category: 'settlement',
  description:
    'Founds villages the way a people actually arrives: one landfall per stretch of coast, then a cost-weighted spread outward that pays dearly for open water, so each village carries the year the frontier reached it.',
  whenToUse:
    'Wire in fertility as the ground worth farming and a travel cost field as what it takes to get there. Villages near a landfall are old and large, the far archipelago young and small.',
  inputs: {
    habitability: {
      kind: 'field',
      label: 'habitability',
      help: 'How worth settling the ground is, usually fertility. Only cells inside the band below are considered.',
    },
    travelCost: {
      kind: 'field',
      label: 'travel cost',
      help: 'What each tile costs to cross. A travel cost node built from the same elevation.',
    },
  },
  params: {
    landfallPitch: {
      kind: 'int',
      label: 'landfall spacing',
      help: 'How far apart, in tiles, the places a people first came ashore are. One landfall is seeded per square this wide.',
      min: 256,
      max: 8192,
      default: 768,
    },
    spacing: {
      kind: 'int',
      label: 'village spacing',
      help: 'Least distance in tiles between two villages. Rivals inside this range are thinned deterministically.',
      min: 24,
      max: 256,
      default: 112,
    },
    minScore: {
      kind: 'number',
      label: 'least habitability',
      help: 'Ground poorer than this is never settled, however easy it is to reach.',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.35,
    },
    spreadSpeed: {
      kind: 'number',
      label: 'spread speed',
      help: 'How many tiles of easy shore the frontier covers in a year. Lower values leave the far archipelago settled only recently, or never.',
      min: 0.05,
      max: 5,
      step: 0.05,
      default: 1.2,
    },
    qualityHaste: {
      kind: 'number',
      label: 'quality haste',
      help: 'How many years earlier the richest ground is settled than the poorest at the same distance.',
      min: 0,
      max: 400,
      step: 5,
      default: 120,
    },
  },
  output: 'points',
  generateChunk: settlementSpreadChunk,
});

function settlementSpreadChunk(ctx: ChunkGenCtx): ChunkValue {
  const points: PointsChunk = [];
  if (!ctx.fieldInput('habitability') || !ctx.fieldInput('travelCost')) return pointsValue(points);
  const arrival = arrivalYearReader(ctx);
  const site = villageSiteTest(ctx, arrival);
  for (let y = 0; y < ctx.size; y++) {
    for (let x = 0; x < ctx.size; x++) {
      collectVillageAt(ctx, site, arrival, ctx.originX + x, ctx.originY + y, points);
    }
  }
  return pointsValue(points);
}

type ArrivalYear = (worldX: number, worldY: number) => number | null;

function arrivalYearReader(ctx: ChunkGenCtx): ArrivalYear {
  const grid = regionCostGrid(ctx);
  const reached = ctx.memo(regionKey(ctx), () =>
    cheapestCostReaching(grid, landfallSourcesFor(ctx, grid)),
  );
  const spreadSpeed = ctx.params.spreadSpeed as number;
  return (worldX, worldY) => {
    const index = gridIndexOf(grid, worldX, worldY);
    if (index === null) return null;
    const reachedAt = reached[index]! / spreadSpeed;
    return Number.isFinite(reachedAt) && reachedAt <= PRESENT ? reachedAt : null;
  };
}

function regionCostGrid(ctx: ChunkGenCtx): CostGrid {
  const costAt = worldFieldReader(ctx, 'travelCost');
  const side = (REGION_CHUNKS * ctx.size) / GRID_STEP + 2 * GRID_MARGIN_CELLS;
  const origin = -GRID_MARGIN_CELLS * GRID_STEP;
  return {
    originX: regionOriginOf(ctx.chunkX, ctx.size) + origin,
    originY: regionOriginOf(ctx.chunkY, ctx.size) + origin,
    side,
    step: GRID_STEP,
    costAt: (worldX, worldY) => (costAt(worldX, worldY) ?? 1) * GRID_STEP,
  };
}

function regionOriginOf(chunkCoord: number, chunkSize: number): number {
  return Math.floor(chunkCoord / REGION_CHUNKS) * REGION_CHUNKS * chunkSize;
}

function regionKey(ctx: ChunkGenCtx): string {
  return `settlement region ${Math.floor(ctx.chunkX / REGION_CHUNKS)},${Math.floor(ctx.chunkY / REGION_CHUNKS)}`;
}

function landfallSourcesFor(ctx: ChunkGenCtx, grid: CostGrid) {
  const spec = { pitch: ctx.params.landfallPitch as number, seed: ctx.hashSeed('landfall lattice') };
  const spreadSpeed = ctx.params.spreadSpeed as number;
  const far = grid.side * grid.step;
  const crossingAt = worldFieldReader(ctx, 'travelCost');
  const reach = Math.round(spec.pitch / 2);
  return landfallCellsOverlapping(
    grid.originX - reach,
    grid.originY - reach,
    grid.originX + far + reach,
    grid.originY + far + reach,
    spec,
  )
    .map((landfall) => shoreInsideGrid(landfall, crossingAt, grid, reach))
    .filter((landfall): landfall is Landfall => landfall !== null)
    .map((landfall) => ({ x: landfall.x, y: landfall.y, cost: landfall.arrived * spreadSpeed }));
}

function shoreInsideGrid(
  landfall: Landfall,
  crossingAt: WorldFieldReader,
  grid: CostGrid,
  reach: number,
): Landfall | null {
  let best: Landfall | null = null;
  let easiest = Infinity;
  for (const spot of searchSpots(landfall, reach)) {
    if (gridIndexOf(grid, spot.x, spot.y) === null) continue;
    const crossing = crossingAt(spot.x, spot.y);
    if (crossing === null || crossing >= easiest) continue;
    best = { x: spot.x, y: spot.y, arrived: landfall.arrived };
    easiest = crossing;
  }
  return best;
}

function searchSpots(landfall: Landfall, reach: number): { x: number; y: number }[] {
  const step = Math.max(8, Math.round(reach / 12));
  const spots: { x: number; y: number }[] = [];
  for (let dy = -reach; dy <= reach; dy += step) {
    for (let dx = -reach; dx <= reach; dx += step) spots.push({ x: landfall.x + dx, y: landfall.y + dy });
  }
  return spots;
}

type SiteTest = (worldX: number, worldY: number) => boolean;

function villageSiteTest(ctx: ChunkGenCtx, arrival: ArrivalYear): SiteTest {
  const habitabilityAt = worldFieldReader(ctx, 'habitability');
  const spacing = ctx.params.spacing as number;
  return (worldX, worldY) =>
    ctx.hash01(worldX, worldY, 'village candidate') < candidateChance(spacing) &&
    scoreAt(habitabilityAt, ctx, worldX, worldY) !== null &&
    arrival(worldX, worldY) !== null;
}

function scoreAt(
  habitabilityAt: WorldFieldReader,
  ctx: ChunkGenCtx,
  worldX: number,
  worldY: number,
): number | null {
  const score = habitabilityAt(worldX, worldY);
  if (score === null || score < (ctx.params.minScore as number)) return null;
  return score;
}

function candidateChance(spacing: number): number {
  return 3 / (spacing * spacing);
}

function collectVillageAt(
  ctx: ChunkGenCtx,
  site: SiteTest,
  arrival: ArrivalYear,
  worldX: number,
  worldY: number,
  into: PointsChunk,
): void {
  if (!site(worldX, worldY)) return;
  if (!winsSpacingContest(ctx, site, worldX, worldY)) return;
  into.push({ x: worldX, y: worldY, tag: VILLAGE_TAG, data: foundingOf(ctx, arrival, worldX, worldY) });
}

function foundingOf(
  ctx: ChunkGenCtx,
  arrival: ArrivalYear,
  worldX: number,
  worldY: number,
): Record<string, number> {
  const habitabilityAt = worldFieldReader(ctx, 'habitability');
  const score = habitabilityAt(worldX, worldY) ?? 0;
  const haste = (ctx.params.qualityHaste as number) * score;
  return { [BORN]: Math.min(PRESENT, (arrival(worldX, worldY) ?? PRESENT) - haste) };
}

function winsSpacingContest(
  ctx: ChunkGenCtx,
  site: SiteTest,
  worldX: number,
  worldY: number,
): boolean {
  const spacing = ctx.params.spacing as number;
  const myRank = villageRank(ctx, worldX, worldY);
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
  return villageRank(ctx, rivalX, rivalY) < myRank;
}

function villageRank(ctx: ChunkGenCtx, worldX: number, worldY: number): number {
  return ctx.hash01(worldX, worldY, 'village rank');
}

import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { pointsValue, type ChunkValue, type PointsChunk } from '../../values/chunkValues';
import { BORN, BORN_ATTR, CHAIN_ID, CHAIN_ID_ATTR, CONE_SHAPE_KEYS, DEPOSIT_KIND, DEPOSIT_KIND_ATTR, HOST_ATTRS, HOST_X, HOST_Y, RICHNESS, RICHNESS_ATTR } from '../../values/pointData';
import { worldFieldReader, type WorldFieldReader } from '../../values/worldInputReaders';
import { depositKindAt } from '../../volcanic/depositBands';
import { SEA_LEVEL } from '../../volcanic/seaLevel';
import { MAX_CONE_RADIUS, type VolcanoCone } from '../../volcanic/hotspotChains';
import { coneOfPoint, nearbyVolcanoes } from './nearbyVolcanoes';

export const DEPOSIT_TAG = 'deposit';

const DEPOSIT_SPACING = 24;
const HOST_REACH = 1.2;

registerNodeType({
  type: 'mineralDeposits',
  title: 'mineral deposits',
  category: 'volcanic',
  description:
    'Seeds ore, obsidian and sulfur on islands old enough to have cooled: a deterministic lottery picks dry cells near an aged cone, a spacing contest thins them, and distance from the summit decides the mineral.',
  whenToUse:
    'Riches that answer to geology. Wire in the same volcanoes and the final elevation, and mines appear only on mature islands — obsidian at the summit, sulfur on the flanks, ore on the outer skirts.',
  inputs: {
    volcanoes: {
      kind: 'points',
      requiresPointAttributes: CONE_SHAPE_KEYS,
      label: 'volcanoes',
      help: 'Volcano points whose ages and footprints decide which islands may carry minerals.',
    },
    elevation: {
      kind: 'field',
      expects: 'elevation',
      label: 'elevation',
      help: 'The final eroded elevation, read across chunk edges so deposits never land in the sea.',
    },
    islandBirth: {
      kind: 'field',
      expects: 'years',
      label: 'island birth',
      help: 'When land first broke water here. A deposit is datable from this plus the ripening age below; without it the host cone\u2019s own eruption date is used instead.',
    },
  },
  params: {
    density: {
      kind: 'number',
      label: 'density',
      help: 'Chance per eligible cell of entering the lottery, before the spacing contest thins the winners.',
      min: 0,
      max: 0.2,
      step: 0.002,
      default: 0.02,
    },
    minIslandAge: {
      kind: 'number',
      label: 'min island age',
      help: 'Years the ground must have stood above water before it bears minerals, counted from the island birth date. Fresh lava has nothing to mine.',
      min: 0,
      max: 5_000_000,
      step: 250_000,
      default: 1_000_000,
    },
    richnessScale: {
      kind: 'number',
      label: 'richness scale',
      help: 'Multiplier on every deposit’s rolled richness, for poorer or richer worlds.',
      min: 0,
      max: 1,
      step: 0.05,
      default: 1,
    },
  },
  output: 'points',
  pointAttributes: [DEPOSIT_KIND_ATTR, RICHNESS_ATTR, BORN_ATTR, CHAIN_ID_ATTR, ...HOST_ATTRS],
  generateChunk: mineralDepositsChunk,
});

function mineralDepositsChunk(ctx: ChunkGenCtx): ChunkValue {
  const points: PointsChunk = [];
  if (!ctx.fieldInput('elevation')) return pointsValue(points);
  const hosts = hostsNear(ctx);
  const site = depositSiteTest(ctx, hosts);
  for (let y = 0; y < ctx.size; y++) {
    for (let x = 0; x < ctx.size; x++) {
      collectDepositAt(ctx, site, hosts, ctx.originX + x, ctx.originY + y, points);
    }
  }
  return pointsValue(points);
}

function hostsNear(ctx: ChunkGenCtx): VolcanoCone[] {
  return nearbyVolcanoes(ctx, 'volcanoes', HOST_REACH * MAX_CONE_RADIUS + DEPOSIT_SPACING).map(
    coneOfPoint,
  );
}

function ripeYearOf(ctx: ChunkGenCtx, host: VolcanoCone, cellX: number, cellY: number): number {
  const birthAt = worldFieldReader(ctx, 'islandBirth');
  const landBorn = ctx.fieldInput('islandBirth') ? (birthAt(cellX, cellY) ?? 0) : 0;
  const born = landBorn !== 0 ? landBorn : host.born;
  return born + (ctx.params.minIslandAge as number);
}

type SiteTest = (cellX: number, cellY: number) => boolean;

function depositSiteTest(ctx: ChunkGenCtx, hosts: readonly VolcanoCone[]): SiteTest {
  const elevationAt = worldFieldReader(ctx, 'elevation');
  return (cellX, cellY) =>
    ctx.hash01(cellX, cellY, 'deposit candidate') < (ctx.params.density as number) &&
    isDryLand(elevationAt, cellX, cellY) &&
    hostConeAt(hosts, cellX, cellY) !== null;
}

function isDryLand(elevationAt: WorldFieldReader, cellX: number, cellY: number): boolean {
  const elevation = elevationAt(cellX, cellY);
  return elevation !== null && elevation > SEA_LEVEL;
}

function hostConeAt(
  hosts: readonly VolcanoCone[],
  cellX: number,
  cellY: number,
): VolcanoCone | null {
  const worldX = cellX;
  const worldY = cellY;
  let nearest: VolcanoCone | null = null;
  let nearestDistance = Infinity;
  for (const cone of hosts) {
    const distance = Math.hypot(worldX - cone.x, worldY - cone.y);
    if (distance > HOST_REACH * cone.radius || distance >= nearestDistance) continue;
    nearest = cone;
    nearestDistance = distance;
  }
  return nearest;
}

function collectDepositAt(
  ctx: ChunkGenCtx,
  site: SiteTest,
  hosts: readonly VolcanoCone[],
  cellX: number,
  cellY: number,
  into: PointsChunk,
): void {
  if (!site(cellX, cellY)) return;
  if (!winsSpacingContest(ctx, site, cellX, cellY)) return;
  const host = hostConeAt(hosts, cellX, cellY);
  if (host) into.push(depositPointOf(ctx, host, cellX, cellY));
}

function winsSpacingContest(
  ctx: ChunkGenCtx,
  site: SiteTest,
  cellX: number,
  cellY: number,
): boolean {
  const myRank = ctx.hash01(cellX, cellY, 'deposit rank');
  for (let dy = -DEPOSIT_SPACING; dy <= DEPOSIT_SPACING; dy++) {
    for (let dx = -DEPOSIT_SPACING; dx <= DEPOSIT_SPACING; dx++) {
      if (rivalOutranks(ctx, site, cellX + dx, cellY + dy, dx * dx + dy * dy, myRank)) return false;
    }
  }
  return true;
}

function rivalOutranks(
  ctx: ChunkGenCtx,
  site: SiteTest,
  rivalX: number,
  rivalY: number,
  distanceSquared: number,
  myRank: number,
): boolean {
  if (distanceSquared === 0 || distanceSquared > DEPOSIT_SPACING * DEPOSIT_SPACING) return false;
  return site(rivalX, rivalY) && ctx.hash01(rivalX, rivalY, 'deposit rank') < myRank;
}

function depositPointOf(
  ctx: ChunkGenCtx,
  host: VolcanoCone,
  cellX: number,
  cellY: number,
): PointsChunk[number] {
  const worldX = cellX;
  const worldY = cellY;
  const distance = Math.hypot(worldX - host.x, worldY - host.y);
  return {
    x: worldX,
    y: worldY,
    tag: DEPOSIT_TAG,
    data: {
      [DEPOSIT_KIND]: depositKindAt(distance, host.radius),
      [RICHNESS]: ctx.hash01(cellX, cellY, 'deposit richness') * (ctx.params.richnessScale as number),
      [BORN]: ripeYearOf(ctx, host, cellX, cellY),
      [CHAIN_ID]: host.chainId,
      [HOST_X]: host.x,
      [HOST_Y]: host.y,
    },
  };
}

import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { EMPTY_TILE, pointsValue, type ChunkValue, type PointsChunk } from '../../values/chunkValues';
import {
  worldFieldReader,
  worldTileReader,
  type WorldFieldReader,
  type WorldTileReader,
} from '../../values/worldInputReaders';

registerNodeType({
  type: 'riverTowns',
  title: 'river towns',
  category: 'water',
  description:
    'Founds towns where rivers meet the sea or meet each other: every river mouth and river junction becomes a candidate, thinned so towns keep their distance.',
  whenToUse:
    'Settlements that sit where geography says they should. Wire in a rivers node and the same elevation field it used; towns then appear at mouths and confluences automatically.',
  inputs: {
    rivers: {
      kind: 'tiles',
      label: 'rivers',
      help: 'A rivers node. Any non-empty cell counts as river when looking for mouths and junctions.',
    },
    elevation: {
      kind: 'field',
      label: 'elevation',
      help: 'The same terrain the rivers flow down; used to spot where a river touches the sea.',
    },
  },
  params: {
    seaLevel: {
      kind: 'number',
      label: 'sea level',
      help: 'Cells below this count as sea. Match the sea level on the rivers node so mouths are found at the real coast.',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.45,
    },
    spacing: {
      kind: 'int',
      label: 'town spacing',
      help: 'Minimum distance in tiles between two towns. Rival candidates within this range are thinned deterministically.',
      min: 4,
      max: 48,
      default: 14,
    },
  },
  output: 'points',
  generateChunk: riverTownsChunk,
});

function riverTownsChunk(ctx: ChunkGenCtx): ChunkValue {
  const points: PointsChunk = [];
  if (!ctx.tilesInput('rivers') || !ctx.fieldInput('elevation')) return pointsValue(points);
  const site = townSiteTest(ctx);
  for (let y = 0; y < ctx.size; y++) {
    for (let x = 0; x < ctx.size; x++) {
      const worldX = ctx.originX + x;
      const worldY = ctx.originY + y;
      if (site(worldX, worldY) && winsSpacingContest(ctx, site, worldX, worldY)) {
        points.push({ x: worldX, y: worldY, tag: 'town' });
      }
    }
  }
  return pointsValue(points);
}

type SiteTest = (worldX: number, worldY: number) => boolean;

function townSiteTest(ctx: ChunkGenCtx): SiteTest {
  const riverAt = worldTileReader(ctx, 'rivers');
  const elevationAt = worldFieldReader(ctx, 'elevation');
  const seaLevel = ctx.params.seaLevel as number;
  return (worldX, worldY) => {
    if (riverAt(worldX, worldY) === EMPTY_TILE) return false;
    return (
      touchesSea(elevationAt, seaLevel, worldX, worldY) || isJunction(riverAt, worldX, worldY)
    );
  };
}

function touchesSea(
  elevationAt: WorldFieldReader,
  seaLevel: number,
  worldX: number,
  worldY: number,
): boolean {
  return NEIGHBOR_STEPS.some(([dx, dy]) => {
    const elevation = elevationAt(worldX + dx, worldY + dy);
    return elevation !== null && elevation < seaLevel;
  });
}

function isJunction(riverAt: WorldTileReader, worldX: number, worldY: number): boolean {
  const riverNeighbors = NEIGHBOR_STEPS.filter(
    ([dx, dy]) => riverAt(worldX + dx, worldY + dy) !== EMPTY_TILE,
  );
  return riverNeighbors.length >= 3;
}

function winsSpacingContest(
  ctx: ChunkGenCtx,
  site: SiteTest,
  worldX: number,
  worldY: number,
): boolean {
  const spacing = ctx.params.spacing as number;
  const myRank = townRank(ctx, worldX, worldY);
  for (let dy = -spacing; dy <= spacing; dy++) {
    for (let dx = -spacing; dx <= spacing; dx++) {
      if (dx === 0 && dy === 0) continue;
      if (dx * dx + dy * dy > spacing * spacing) continue;
      const rivalX = worldX + dx;
      const rivalY = worldY + dy;
      if (!site(rivalX, rivalY)) continue;
      if (townRank(ctx, rivalX, rivalY) < myRank) return false;
    }
  }
  return true;
}

function townRank(ctx: ChunkGenCtx, worldX: number, worldY: number): number {
  return ctx.hash01(worldX, worldY, 'town rank');
}

const NEIGHBOR_STEPS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

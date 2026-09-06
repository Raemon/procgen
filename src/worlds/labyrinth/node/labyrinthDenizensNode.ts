import { registerNodeType } from '@/features/asset-library/worlds/nodeRegistry';
import type { ChunkGenCtx } from '@/features/asset-library/worlds/nodeType';
import { pointsValue, type ChunkValue, type PointsChunk, type TilesChunk } from '@/features/asset-library/worlds/values/chunkValues';
import { lairInCell, type DenizenLair } from '../generate/layout/denizenLairs';
import { LABYRINTH_CELL_SIZE, labyrinthCellCoordOf, labyrinthCellOrigin } from '../generate/layout/labyrinthLattice';

export const DENIZEN_TAG = 'denizen';
const DENIZEN_SEED_LABEL = 'denizens';

registerNodeType({
  type: 'labyrinthDenizens',
  title: 'labyrinth denizens',
  category: 'maze',
  description:
    'One rare inhabitant per haunted labyrinth cell, standing on a floor tile of the room or warren painted there. It reads the labyrinth it is given rather than laying one out of its own, so an inhabitant never wakes inside a wall. Rings near the origin are left empty so the opening stays a place to learn in.',
  whenToUse:
    'The thing you did not want to meet, in a world made of rooms. Feed it the labyrinth tiles beside it and bind it to a creature, so the delve has something living in it as well as puzzles.',
  inputs: {
    labyrinth: {
      kind: 'tiles',
      label: 'labyrinth',
      help: 'The painted labyrinth these things live in. Their lairs are picked from its floor tiles, so they stand where you can walk.',
    },
  },
  params: {
    floorTile: {
      kind: 'tile',
      label: 'floor',
      help: 'The floor tile of the labyrinth above. Cells painted with it are where an inhabitant may stand.',
    },
    rarity: {
      kind: 'number',
      label: 'rarity',
      help: 'Chance that any one cell beyond the safe rings is home to something. 0.05 makes an encounter roughly every twenty rooms.',
      min: 0,
      max: 0.5,
      step: 0.01,
      default: 0.05,
    },
    safeRings: {
      kind: 'int',
      label: 'safe rings',
      help: 'Rings of cells around the origin left empty, so nothing is met before the puzzle kinds have been taught.',
      min: 0,
      max: 12,
      default: 4,
    },
  },
  output: 'points',
  generateChunk: denizenChunk,
});

interface CellCoord {
  x: number;
  y: number;
}

function denizenChunk(ctx: ChunkGenCtx): ChunkValue {
  const labyrinth = ctx.tilesInput('labyrinth');
  if (!labyrinth) return pointsValue([]);
  const seed = ctx.hashSeed(DENIZEN_SEED_LABEL);
  const denizens = denizenKnobsOf(ctx);
  const floorTile = ctx.params.floorTile as number;
  const points: PointsChunk = cellsOfChunk(ctx).flatMap((cell) => {
    const floors = floorCellsOf(ctx, labyrinth, cell.x, cell.y, floorTile);
    const lair = lairInCell(cell.x, cell.y, seed, denizens, floors);
    return lair ? [{ x: lair.x, y: lair.y, tag: DENIZEN_TAG }] : [];
  });
  return pointsValue(points);
}

function cellsOfChunk(ctx: ChunkGenCtx): CellCoord[] {
  const cellsAcross = ctx.size / LABYRINTH_CELL_SIZE;
  const firstCellX = labyrinthCellCoordOf(ctx.originX);
  const firstCellY = labyrinthCellCoordOf(ctx.originY);
  const cells: CellCoord[] = [];
  for (let cy = 0; cy < cellsAcross; cy++) {
    for (let cx = 0; cx < cellsAcross; cx++) cells.push({ x: firstCellX + cx, y: firstCellY + cy });
  }
  return cells;
}

function floorCellsOf(
  ctx: ChunkGenCtx,
  labyrinth: TilesChunk,
  cellX: number,
  cellY: number,
  floorTile: number,
): DenizenLair[] {
  const originX = labyrinthCellOrigin(cellX);
  const originY = labyrinthCellOrigin(cellY);
  const floors: DenizenLair[] = [];
  for (let y = 0; y < LABYRINTH_CELL_SIZE; y++) {
    for (let x = 0; x < LABYRINTH_CELL_SIZE; x++) {
      const world = { x: originX + x, y: originY + y };
      const index = (world.y - ctx.originY) * ctx.size + (world.x - ctx.originX);
      if (labyrinth[index] === floorTile) floors.push(world);
    }
  }
  return floors;
}

function denizenKnobsOf(ctx: ChunkGenCtx) {
  return {
    rarity: ctx.params.rarity as number,
    safeRings: ctx.params.safeRings as number,
  };
}

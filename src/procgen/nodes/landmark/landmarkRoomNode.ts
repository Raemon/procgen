import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { tilesValue, type ChunkValue, type TilesChunk } from '../../values/chunkValues';

registerNodeType({
  type: 'landmarkRoom',
  title: 'landmark room',
  category: 'landmark',
  description:
    'Stamps one rectangular room of floor, optionally ringed by a wall, at exact world coordinates. Cells outside it are left empty so the layer below shows through.',
  whenToUse:
    'Guaranteeing a place exists where a generator would only maybe put one: the room the player wakes up in, a vault, a plaza carved out of a labyrinth.',
  inputs: {},
  params: {
    x: {
      kind: 'int',
      label: 'centre x',
      help: 'World x of the middle of the room, in tiles.',
      min: -4096,
      max: 4096,
      default: 0,
    },
    y: {
      kind: 'int',
      label: 'centre y',
      help: 'World y of the middle of the room, in tiles.',
      min: -4096,
      max: 4096,
      default: 0,
    },
    width: {
      kind: 'int',
      label: 'width',
      help: 'Floor width in tiles, not counting the wall ring.',
      min: 1,
      max: 64,
      default: 11,
    },
    height: {
      kind: 'int',
      label: 'height',
      help: 'Floor height in tiles, not counting the wall ring.',
      min: 1,
      max: 64,
      default: 11,
    },
    wallThickness: {
      kind: 'int',
      label: 'wall thickness',
      help: 'How many tiles of wall ring the floor. 0 leaves the room open to whatever surrounds it.',
      min: 0,
      max: 8,
      default: 0,
    },
    floorTile: { kind: 'tile', label: 'floor', help: 'Tile painted inside the room.' },
    wallTile: {
      kind: 'tile',
      label: 'wall',
      help: 'Tile painted on the ring around the floor, when wall thickness is above 0.',
    },
  },
  output: 'tiles',
  generateChunk: landmarkRoomChunk,
});

function landmarkRoomChunk(ctx: ChunkGenCtx): ChunkValue {
  const tiles = ctx.newTiles();
  for (let y = 0; y < ctx.size; y++) {
    for (let x = 0; x < ctx.size; x++) {
      paintRoomCell(ctx, tiles, x, y);
    }
  }
  return tilesValue(tiles);
}

function paintRoomCell(ctx: ChunkGenCtx, tiles: TilesChunk, x: number, y: number): void {
  const insideness = roomInsideness(ctx, ctx.originX + x, ctx.originY + y);
  if (insideness === 'outside') return;
  tiles[y * ctx.size + x] =
    insideness === 'floor' ? (ctx.params.floorTile as number) : (ctx.params.wallTile as number);
}

type Insideness = 'floor' | 'wall' | 'outside';

function roomInsideness(ctx: ChunkGenCtx, worldX: number, worldY: number): Insideness {
  const dx = Math.abs(worldX - (ctx.params.x as number));
  const dy = Math.abs(worldY - (ctx.params.y as number));
  const floorX = halfSpan(ctx.params.width as number);
  const floorY = halfSpan(ctx.params.height as number);
  if (dx <= floorX && dy <= floorY) return 'floor';
  const wall = ctx.params.wallThickness as number;
  return dx <= floorX + wall && dy <= floorY + wall ? 'wall' : 'outside';
}

function halfSpan(span: number): number {
  return Math.floor((span - 1) / 2);
}

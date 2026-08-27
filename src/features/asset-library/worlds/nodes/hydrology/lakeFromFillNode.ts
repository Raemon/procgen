import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { tilesValue, type ChunkValue } from '../../values/chunkValues';

registerNodeType({
  type: 'lakeFromFill',
  title: 'lakes from fill',
  category: 'water',
  description:
    'Paints standing water wherever a flooded surface sits above the ground it drowned, so every hollow the terrain closed off becomes a lake at exactly the level it would spill from.',
  whenToUse:
    'Wire the terrain in as ground and the matching fill depressions node in as flooded. Because the flooded surface is flat inside a basin, using that same node as the elevation display puts the water at one level across the whole lake instead of draping it over the lake bed.',
  inputs: {
    ground: { kind: 'field', expects: 'elevation', label: 'ground', help: 'The terrain before flooding — the lake bed.' },
    flooded: {
      kind: 'field',
      expects: 'elevation',
      label: 'flooded',
      help: 'The same terrain after fill depressions. Where this stands above the ground, the difference is how deep the water is.',
    },
  },
  params: {
    seaLevel: {
      kind: 'number',
      label: 'sea level',
      help: 'Hollows below this belong to the ocean, not to a lake, so the sea floor is not painted as inland water.',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.5,
    },
    minDepth: {
      kind: 'number',
      label: 'least depth',
      help: 'How deep the water must be before it counts as a lake. Raising it drops the film of water that fill depressions leaves in every shallow dent, keeping only real basins.',
      min: 0.001,
      max: 0.2,
      step: 0.001,
      default: 0.006,
    },
    shallowDepth: {
      kind: 'number',
      label: 'shallow band',
      help: 'Water shallower than this is painted as the shallow tile, which reads as the shelving margin around a lake rather than a hard edge.',
      min: 0,
      max: 0.2,
      step: 0.001,
      default: 0.02,
    },
    lakeTile: { kind: 'tile', label: 'lake', help: 'Tile painted where the water is deep.' },
    shallowTile: { kind: 'tile', label: 'shallows', help: 'Tile painted around the rim, inside the shallow band.' },
  },
  output: 'tiles',
  generateChunk: lakeFromFillChunk,
});

function lakeFromFillChunk(ctx: ChunkGenCtx): ChunkValue {
  const tiles = ctx.newTiles();
  const ground = ctx.fieldInput('ground');
  const flooded = ctx.fieldInput('flooded');
  if (!ground || !flooded) return tilesValue(tiles);
  const seaLevel = ctx.params.seaLevel as number;
  for (let i = 0; i < tiles.length; i++) {
    if (flooded[i]! < seaLevel) continue;
    const tile = lakeTileForDepth(ctx, flooded[i]! - ground[i]!);
    if (tile !== null) tiles[i] = tile;
  }
  return tilesValue(tiles);
}

function lakeTileForDepth(ctx: ChunkGenCtx, depth: number): number | null {
  if (depth < (ctx.params.minDepth as number)) return null;
  const shallow = depth < (ctx.params.shallowDepth as number);
  return (shallow ? ctx.params.shallowTile : ctx.params.lakeTile) as number;
}

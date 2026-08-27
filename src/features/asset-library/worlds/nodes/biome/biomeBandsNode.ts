import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { EMPTY_TILE, tilesValue, type ChunkValue } from '../../values/chunkValues';
import { bandTileAt, type BiomeBands } from './biomeBands';

registerNodeType({
  type: 'biomeBands',
  title: 'biome',
  category: 'biome',
  description:
    'One card that turns terrain into the tiles of a single biome: sea floor, shallows, shore, ground, bare rock and snow, each with its own tile and its own cut point.',
  whenToUse:
    'Instead of stacking five threshold nodes per biome. Wire a region mask and give each biome its own node, and the whole biome is then one card with the handful of knobs you actually retune — where its snow starts, how wide its beaches are, how steep the ground has to be before soil gives way to rock.',
  inputs: {
    elevation: { kind: 'field', expects: 'elevation', label: 'elevation', help: 'The terrain being classified. Every cut point below is read in this field\'s units.' },
    steepness: {
      kind: 'field',
      expects: 'unit',
      label: 'steepness',
      help: 'Optional slope field. Where it reaches the rock cut point, ground becomes bare rock. Unwired means no rock is painted.',
      optional: true,
    },
    shoreDistance: {
      kind: 'field',
      expects: 'distance',
      label: 'shore distance',
      help: 'Optional distance-to-coast field, where 0.5 is the shoreline. Beaches are cut from it so they keep an even width. Unwired means the shore band is measured in height above sea level instead.',
      optional: true,
    },
    region: {
      kind: 'field',
      expects: 'unit',
      label: 'region',
      help: 'Optional mask saying where this biome exists at all. Cells below the region cut point are left empty for another biome to paint. Unwired means this biome covers the world.',
      optional: true,
    },
  },
  params: {
    seaLevel: {
      kind: 'number',
      label: 'sea level',
      help: 'Terrain below this is underwater.',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.5,
    },
    deepDrop: {
      kind: 'number',
      label: 'deep below',
      help: 'How far under sea level the water has to be before it counts as deep. 0 makes the whole sea deep.',
      min: 0,
      max: 0.5,
      step: 0.01,
      default: 0.06,
    },
    shoreBand: {
      kind: 'number',
      label: 'shore band',
      help: 'Width of the shore strip, which wins over rock so beaches survive a steep coast. With shore distance wired this is in distance units past the shoreline; without it, it is height above sea level. Set it to 0 for a coast of bare cliffs.',
      min: 0,
      max: 0.5,
      step: 0.01,
      default: 0.06,
    },
    rockAbove: {
      kind: 'number',
      label: 'rock above steepness',
      help: 'Ground steeper than this is bare rock rather than soil. Only used when a steepness field is wired.',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.45,
    },
    snowLine: {
      kind: 'number',
      label: 'snow line',
      help: 'Terrain at or above this is snow, overriding rock and ground. Set it to 1 for a biome that never gets snow.',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.85,
    },
    regionAtLeast: {
      kind: 'number',
      label: 'region ≥',
      help: 'How high the region mask has to be for this biome to paint at all.',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.5,
    },
    deepTile: { kind: 'tile', label: 'deep water', help: 'Tile for water below the deep cut point.' },
    waterTile: { kind: 'tile', label: 'water', help: 'Tile for water above the deep cut point.' },
    shoreTile: { kind: 'tile', label: 'shore', help: 'Tile for the strip of land along the waterline.' },
    groundTile: { kind: 'tile', label: 'ground', help: 'Tile for ordinary land — everything not shore, rock or snow.' },
    rockTile: { kind: 'tile', label: 'rock', help: 'Tile for ground too steep to hold soil.' },
    snowTile: { kind: 'tile', label: 'snow', help: 'Tile for ground above the snow line.' },
  },
  output: 'tiles',
  generateChunk: biomeBandsChunk,
});

function biomeBandsChunk(ctx: ChunkGenCtx): ChunkValue {
  const tiles = ctx.newTiles();
  const elevation = ctx.fieldInput('elevation');
  if (!elevation) return tilesValue(tiles);
  const bands = bandsOf(ctx);
  const steepness = ctx.fieldInput('steepness');
  const shoreDistance = ctx.fieldInput('shoreDistance');
  const region = ctx.fieldInput('region');
  for (let i = 0; i < tiles.length; i++) {
    tiles[i] = inRegion(ctx, region?.[i])
      ? bandTileAt(bands, elevation[i]!, steepness?.[i], shoreDistance?.[i])
      : EMPTY_TILE;
  }
  return tilesValue(tiles);
}

function inRegion(ctx: ChunkGenCtx, maskValue: number | undefined): boolean {
  return maskValue === undefined || maskValue >= (ctx.params.regionAtLeast as number);
}

function bandsOf(ctx: ChunkGenCtx): BiomeBands {
  return {
    seaLevel: ctx.params.seaLevel as number,
    deepDrop: ctx.params.deepDrop as number,
    shoreBand: ctx.params.shoreBand as number,
    rockAbove: ctx.params.rockAbove as number,
    snowLine: ctx.params.snowLine as number,
    tiles: {
      deep: ctx.params.deepTile as number,
      water: ctx.params.waterTile as number,
      shore: ctx.params.shoreTile as number,
      ground: ctx.params.groundTile as number,
      rock: ctx.params.rockTile as number,
      snow: ctx.params.snowTile as number,
    },
  };
}

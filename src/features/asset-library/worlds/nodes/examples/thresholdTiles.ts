import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { tilesValue, type ChunkValue } from '../../values/chunkValues';

registerNodeType({
  type: 'thresholdTiles',
  title: 'threshold → tiles',
  category: 'basics',
  description: 'Splits a field at a threshold and paints a tile on each side. Pick "empty" to leave cells for lower layers.',
  whenToUse:
    'The main way fields become visible terrain. Stack several of these on one noise field, each with a higher threshold and "(empty)" below, to get biome bands like ocean → sand → grass → peaks.',
  inputs: {
    source: { kind: 'field', expects: 'unit', label: 'source', help: 'The field to split — usually a noise field, or a combine of several.' },
  },
  params: {
    threshold: {
      kind: 'number',
      label: 'threshold',
      help: 'The cut point in 0..1. Cells at or above it get the "above" tile, the rest get "below".',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.5,
    },
    belowTile: {
      kind: 'tile',
      label: 'below',
      help: 'Tile painted where the field is under the threshold.',
    },
    aboveTile: {
      kind: 'tile',
      label: 'above',
      help: 'Tile painted where the field reaches the threshold.',
    },
  },
  output: 'tiles',
  generateChunk: thresholdChunk,
});

function thresholdChunk(ctx: ChunkGenCtx): ChunkValue {
  const source = ctx.fieldInput('source');
  const tiles = ctx.newTiles();
  if (!source) return tilesValue(tiles);
  const threshold = ctx.params.threshold as number;
  const belowTile = ctx.params.belowTile as number;
  const aboveTile = ctx.params.aboveTile as number;
  for (let i = 0; i < tiles.length; i++) {
    tiles[i] = source[i]! >= threshold ? aboveTile : belowTile;
  }
  return tilesValue(tiles);
}

import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { tilesValue, type ChunkValue } from '../../values/chunkValues';

registerNodeType({
  type: 'thresholdTiles',
  title: 'threshold → tiles',
  category: 'examples',
  description: 'Splits a field at a threshold and paints a tile on each side. Pick "empty" to leave cells for lower layers.',
  inputs: {
    source: { kind: 'field', label: 'source' },
  },
  params: {
    threshold: { kind: 'number', label: 'threshold', min: 0, max: 1, step: 0.01, default: 0.5 },
    belowTile: { kind: 'tile', label: 'below' },
    aboveTile: { kind: 'tile', label: 'above' },
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

import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { tilesValue, type ChunkValue } from '../../values/chunkValues';
import { carvedMazeWindow, MAZE_CARVE_PARAMS } from './carvedMazeWindow';

registerNodeType({
  type: 'mazeChunk',
  title: 'labyrinth',
  category: 'maze',
  description:
    'Carves an endless labyrinth from numeric knobs: corridor width, wall thickness, how many chunks each self-contained maze spans, and how much of it opens into rooms. Mazes join to every neighbor through border doors so the whole world stays connected.',
  whenToUse:
    'Dungeon-like structure instead of organic noise terrain. Turn the rooms knob up for a dungeon of chambers linked by passages instead of pure corridor. Layer two of these at different maze sizes for nested labyrinths (give the big one an empty floor so the small one shows through), or scatter monsters and loot on top with points nodes.',
  inputs: {},
  params: {
    ...MAZE_CARVE_PARAMS,
    wallTile: { kind: 'tile', label: 'wall', help: 'Tile painted on maze walls. Pick (empty) to let lower layers show through the walls.' },
    floorTile: { kind: 'tile', label: 'floor', help: 'Tile painted on corridors and doors. Pick (empty) to let lower layers show through the corridors — the trick behind nesting a small labyrinth inside a big one.' },
  },
  output: 'tiles',
  generateChunk: mazeChunk,
});

function mazeChunk(ctx: ChunkGenCtx): ChunkValue {
  return tilesValue(
    carvedMazeWindow(ctx, ctx.params.wallTile as number, ctx.params.floorTile as number),
  );
}

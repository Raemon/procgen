import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { tilesValue, type ChunkValue } from '../../values/chunkValues';

registerNodeType({
  type: 'rapidsFromFlow',
  title: 'rapids from flow',
  category: 'water',
  description:
    'Marks the stretches where a watercourse is both carrying real water and running down a steep grade — the places a river breaks white instead of gliding.',
  whenToUse:
    'After rivers are painted, layered over them. Rapids are what tells you a river is descending: they cluster where a channel leaves the mountains and thin out as the grade eases toward the coast, so the same river reads as fast at the top and slow at the mouth.',
  inputs: {
    flow: { kind: 'field', expects: 'unit', label: 'flow', help: 'A flow accumulation field. Only cells carrying at least the threshold flow can break white.' },
    steepness: {
      kind: 'field',
      expects: 'unit',
      label: 'steepness',
      help: 'A slope field measured over the same terrain. This is what separates a rapid from a calm reach.',
    },
    elevation: {
      kind: 'field',
      expects: 'elevation',
      label: 'elevation',
      help: 'Optional terrain used to keep broken water out of the sea, where the shelf can be steep and the river layer has already stopped painting. Wire the same field the rivers read.',
      optional: true,
    },
  },
  params: {
    minFlow: {
      kind: 'number',
      label: 'needs flow above',
      help: 'How much water a cell must carry before it can break white. Below this the grade may be steep but there is only a trickle to show for it.',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.45,
    },
    minSteepness: {
      kind: 'number',
      label: 'breaks white above',
      help: 'The grade at which the water starts to break. Lower it and most of the river runs as rapids; raise it and only the headwater drops do.',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.3,
    },
    seaLevel: {
      kind: 'number',
      label: 'sea level',
      help: 'With elevation wired, cells below this belong to the ocean and are left alone, so rapids stop where the river does.',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.5,
    },
    rapidsTile: { kind: 'tile', label: 'rapids', help: 'Tile painted on the broken water.' },
  },
  output: 'tiles',
  generateChunk: rapidsFromFlowChunk,
});

function rapidsFromFlowChunk(ctx: ChunkGenCtx): ChunkValue {
  const tiles = ctx.newTiles();
  const flow = ctx.fieldInput('flow');
  const steepness = ctx.fieldInput('steepness');
  if (!flow || !steepness) return tilesValue(tiles);
  const elevation = ctx.fieldInput('elevation');
  const minFlow = ctx.params.minFlow as number;
  const minSteepness = ctx.params.minSteepness as number;
  const seaLevel = ctx.params.seaLevel as number;
  for (let i = 0; i < tiles.length; i++) {
    if (elevation && elevation[i]! < seaLevel) continue;
    if (flow[i]! >= minFlow && steepness[i]! >= minSteepness) tiles[i] = ctx.params.rapidsTile as number;
  }
  return tilesValue(tiles);
}

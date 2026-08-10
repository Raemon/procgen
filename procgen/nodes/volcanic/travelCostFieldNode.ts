import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { fieldValue, type ChunkValue } from '../../values/chunkValues';

registerNodeType({
  type: 'travelCostField',
  title: 'travel cost',
  category: 'volcanic',
  description:
    'Turns elevation into what it costs to cross a tile: cheap along the shore, dearer inland and uphill, and dearest over deep water, so a spreading people hugs the coast and hops the narrows.',
  whenToUse:
    'Between the terrain and settlement spread. Raising the sea cost keeps colonists island-hopping short gaps instead of striking out across the ocean.',
  inputs: {
    elevation: {
      kind: 'field',
      label: 'elevation',
      help: 'The final eroded elevation. Anything below sea level is crossed by boat and priced accordingly.',
    },
  },
  params: {
    seaLevel: {
      kind: 'number',
      label: 'sea level',
      help: 'Cells at or below this are open water. Match the sea level the rest of the world uses.',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.45,
    },
    seaCost: {
      kind: 'number',
      label: 'deep water cost',
      help: 'What one tile of the deepest water costs against one tile of level shore. High values confine a people to the island it landed on.',
      min: 1,
      max: 60,
      step: 1,
      default: 6,
    },
    climbCost: {
      kind: 'number',
      label: 'climb cost',
      help: 'What height above the shore adds to crossing a land tile, so people follow the lowlands rather than the ridges.',
      min: 0,
      max: 20,
      step: 0.5,
      default: 6,
    },
  },
  output: 'field',
  generateChunk: travelCostChunk,
});

function travelCostChunk(ctx: ChunkGenCtx): ChunkValue {
  const out = ctx.newField();
  const elevation = ctx.fieldInput('elevation');
  if (!elevation) return fieldValue(out);
  for (let index = 0; index < out.length; index++) out[index] = costOfCell(ctx, elevation[index]!);
  return fieldValue(out);
}

function costOfCell(ctx: ChunkGenCtx, elevation: number): number {
  const seaLevel = ctx.params.seaLevel as number;
  if (elevation <= seaLevel) return waterCost(ctx, seaLevel - elevation, seaLevel);
  return 1 + (ctx.params.climbCost as number) * (elevation - seaLevel);
}

function waterCost(ctx: ChunkGenCtx, depth: number, seaLevel: number): number {
  const deepness = seaLevel <= 0 ? 1 : Math.min(1, depth / seaLevel);
  return 1 + (ctx.params.seaCost as number) * deepness;
}

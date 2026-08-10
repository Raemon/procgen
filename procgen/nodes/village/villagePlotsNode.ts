import { buildingPointOf } from '../../assembly/buildingPoint';
import { PROGRAM_CATALOG } from '../../assembly/programCatalog';
import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { pointsValue, type ChunkValue, type PointsChunk } from '../../values/chunkValues';
import { nearbyVillageCenters } from './nearbyVillageCenters';
import { villageHashSeedAt } from './villageHashSeed';
import { layoutForCenter, type VillagePlot } from './villageLayout';
import { villageLayoutKnobsOf, VILLAGE_LAYOUT_PARAMS } from './villageLayoutParams';
import { programWeightKnobs, weightKnobName } from './programWeightKnobs';

registerNodeType({
  type: 'villagePlots',
  title: 'village plots',
  category: 'settlement',
  description:
    'Lays every village center out into streets and plots, then emits one tagged building point per plot: the town hall by the plaza, an inn and a smithy on the inner rings, cottages and dwellings further out.',
  whenToUse:
    'The buildings of a village. Bind this node to a culture in the structures display mode and each point grows into an assembled building; give the streets node the same center input and the same layout knobs so roads and houses agree.',
  inputs: {
    centers: {
      kind: 'points',
      label: 'centers',
      help: 'A village centers node. Every center within the layout radius plans its own streets and plots.',
    },
  },
  params: {
    ...VILLAGE_LAYOUT_PARAMS,
    ...programWeightKnobs(),
  },
  output: 'points',
  generateChunk: villagePlotsChunk,
});

function villagePlotsChunk(ctx: ChunkGenCtx): ChunkValue {
  const points: PointsChunk = [];
  if (!ctx.pointsInput('centers')) return pointsValue(points);
  const knobs = villageLayoutKnobsOf(ctx, programWeightsOf(ctx));
  for (const center of nearbyVillageCenters(ctx, 'centers', knobs.radius)) {
    const plan = layoutForCenter(villageHashSeedAt(center.x, center.y), center.x, center.y, knobs);
    for (const plot of plan.plots) collectPlotInChunk(ctx, plot, points);
  }
  return pointsValue(points);
}

function collectPlotInChunk(ctx: ChunkGenCtx, plot: VillagePlot, into: PointsChunk): void {
  const insideX = plot.spec.x >= ctx.originX && plot.spec.x < ctx.originX + ctx.size;
  const insideY = plot.spec.y >= ctx.originY && plot.spec.y < ctx.originY + ctx.size;
  if (!insideX || !insideY) return;
  into.push(buildingPointOf(plot.spec));
}

function programWeightsOf(ctx: ChunkGenCtx): number[] {
  return PROGRAM_CATALOG.map((def) => ctx.params[weightKnobName(def.name)] as number);
}

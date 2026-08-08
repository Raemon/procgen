import { specToTag } from '../../assembly/buildingSpecTag';
import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { pointsValue, type ChunkValue, type PointsChunk } from '../../values/chunkValues';
import { nearbyVillageCenters } from './nearbyVillageCenters';
import { villageHashSeedAt } from './villageHashSeed';
import { layoutForCenter, type VillagePlot } from './villageLayout';
import { villageLayoutKnobsOf, VILLAGE_LAYOUT_PARAMS } from './villageLayoutParams';

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
    cottageWeight: {
      kind: 'int',
      label: 'cottages',
      help: 'Relative share of outer plots that become cottages, the smallest single-story house.',
      min: 0,
      max: 8,
      default: 4,
    },
    dwellingWeight: {
      kind: 'int',
      label: 'dwellings',
      help: 'Relative share of outer plots that become two-story dwellings.',
      min: 0,
      max: 8,
      default: 3,
    },
    smithyWeight: {
      kind: 'int',
      label: 'smithies',
      help: 'Set to 0 to keep smithies out of the village; any higher value lets the second ring hold one.',
      min: 0,
      max: 8,
      default: 2,
    },
    innWeight: {
      kind: 'int',
      label: 'inns',
      help: 'Set to 0 to keep inns out of the village; any higher value lets the inner ring hold one.',
      min: 0,
      max: 8,
      default: 1,
    },
    townHallWeight: {
      kind: 'int',
      label: 'town halls',
      help: 'Set to 0 to leave the plaza plot to an ordinary house; any higher value gives the village its one town hall.',
      min: 0,
      max: 8,
      default: 1,
    },
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
  into.push({ x: plot.spec.x, y: plot.spec.y, tag: specToTag(plot.spec) });
}

function programWeightsOf(ctx: ChunkGenCtx): number[] {
  return [
    ctx.params.cottageWeight as number,
    ctx.params.dwellingWeight as number,
    ctx.params.smithyWeight as number,
    ctx.params.innWeight as number,
    ctx.params.townHallWeight as number,
  ];
}

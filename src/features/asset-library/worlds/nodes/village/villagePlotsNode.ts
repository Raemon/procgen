import { buildingPointOf } from '../../assembly/buildingPoint';
import { PROGRAM_CATALOG } from '../../assembly/programCatalog';
import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { pointsValue, type ChunkValue, type PointsChunk, type WorldPoint } from '../../values/chunkValues';
import { BORN, BORN_ATTR, FACING_ATTR, PROGRAM_ATTR, pointNumber } from '../../values/pointData';
import { worldFieldReader } from '../../values/worldInputReaders';
import { PLOT_STAGGER_LABEL, plotBuiltYear } from './plotBuiltYear';
import { plotStandsOnGround } from './plotStandsOnGround';
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
      requiresPointAttributes: [BORN],
      label: 'centers',
      help: 'A village centers node. Every center within the layout radius plans its own streets and plots.',
    },
    ground: {
      kind: 'field',
      expects: 'elevation',
      label: 'ground',
      help: 'Optional elevation. Wire it in and a plot whose ground lies below the building line is left unbuilt, so no house stands in water.',
    },
  },
  params: {
    ...VILLAGE_LAYOUT_PARAMS,
    buildAbove: {
      kind: 'number',
      label: 'build above',
      help: 'Ground below this height carries no buildings. Only bites when a ground field is wired in; set it to the sea level of the world.',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0,
    },
    ...programWeightKnobs(),
  },
  output: 'points',
  pointAttributes: [PROGRAM_ATTR, FACING_ATTR, BORN_ATTR],
  readsTime: true,
  generateChunk: villagePlotsChunk,
});

function villagePlotsChunk(ctx: ChunkGenCtx): ChunkValue {
  const points: PointsChunk = [];
  if (!ctx.pointsInput('centers')) return pointsValue(points);
  const knobs = villageLayoutKnobsOf(ctx, programWeightsOf(ctx));
  for (const center of nearbyVillageCenters(ctx, 'centers', knobs.radius)) {
    const plan = layoutForCenter(villageHashSeedAt(center.x, center.y), center, knobs);
    for (const plot of plan.plots) collectPlotInChunk(ctx, center, plot, points);
  }
  return pointsValue(points);
}

function collectPlotInChunk(
  ctx: ChunkGenCtx,
  center: WorldPoint,
  plot: VillagePlot,
  into: PointsChunk,
): void {
  const insideX = plot.spec.x >= ctx.originX && plot.spec.x < ctx.originX + ctx.size;
  const insideY = plot.spec.y >= ctx.originY && plot.spec.y < ctx.originY + ctx.size;
  if (!insideX || !insideY) return;
  const groundAt = ctx.fieldInput('ground') ? worldFieldReader(ctx, 'ground') : null;
  if (!plotStandsOnGround(groundAt, plot, ctx.params.buildAbove as number)) return;
  const built = builtYearOf(ctx, center, plot);
  if (built > ctx.time) return;
  const point = buildingPointOf(plot.spec);
  into.push({ ...point, data: { ...point.data, [BORN]: built } });
}

function builtYearOf(ctx: ChunkGenCtx, center: WorldPoint, plot: VillagePlot): number {
  const stagger = ctx.hash01(plot.spec.x, plot.spec.y, PLOT_STAGGER_LABEL);
  return plotBuiltYear(pointNumber(center, BORN, -Infinity), plot.ring, stagger);
}

function programWeightsOf(ctx: ChunkGenCtx): number[] {
  return PROGRAM_CATALOG.map((def) => ctx.params[weightKnobName(def.name)] as number);
}

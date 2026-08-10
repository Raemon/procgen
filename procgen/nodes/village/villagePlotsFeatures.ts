import { spokenProgramName } from '../../assembly/programCatalog';
import { PROGRAM_CATALOG } from '../../assembly/programCatalog';
import { featureKey, RANK_DETAIL, type ExtractedFeature } from '../../features/feature';
import {
  registerFeatureExtractor,
  type FeatureExtractionRequest,
} from '../../features/featureExtractorRegistry';
import type { NodeInstance } from '../../pipeline/pipelineState';
import type { WorldPoint } from '../../values/chunkValues';
import { pointsInRect, type WorldRect } from '../../values/pointsInRect';
import { weightKnobName } from './programWeightKnobs';
import { villageHashSeedAt } from './villageHashSeed';
import { layoutForCenter, type VillageLayoutKnobs, type VillagePlot } from './villageLayout';
import { PLOT_STAGGER_LABEL, plotBuiltYear } from './plotBuiltYear';
import { hashLatticePoint } from '../../noise/hashLatticePoint';
import { labelSeed } from '../../random/labelSeed';
import { BORN, pointNumber } from '../../values/pointData';

registerFeatureExtractor('villagePlots', villagePlotsFeatures);

function villagePlotsFeatures(request: FeatureExtractionRequest): ExtractedFeature[] {
  const centersId = request.node.inputs.centers;
  if (!centersId) return [];
  const knobs = layoutKnobsOf(request.node);
  const reach = grownBy(request.rect, knobs.radius);
  const staggerSeed = labelSeed(request.seed, request.node.id, PLOT_STAGGER_LABEL);
  return pointsInRect(request.evaluator, centersId, reach).flatMap((center) =>
    plotFeaturesOfCenter(center, centersId, knobs, request.rect, request.time, staggerSeed),
  );
}

function plotFeaturesOfCenter(
  center: WorldPoint,
  centersId: string,
  knobs: VillageLayoutKnobs,
  rect: WorldRect,
  time: number,
  staggerSeed: number,
): ExtractedFeature[] {
  const plan = layoutForCenter(villageHashSeedAt(center.x, center.y), center, knobs);
  return plan.plots
    .filter((plot) => plotAnchorInRect(plot, rect))
    .filter((plot) => standingBy(plot, center, time, staggerSeed))
    .map((plot) => plotFeature(plot, featureKey(centersId, center.x, center.y)));
}

function standingBy(
  plot: VillagePlot,
  center: WorldPoint,
  time: number,
  staggerSeed: number,
): boolean {
  const stagger = hashLatticePoint(plot.spec.x, plot.spec.y, staggerSeed);
  return plotBuiltYear(pointNumber(center, BORN, -Infinity), plot.ring, stagger) <= time;
}

function plotFeature(plot: VillagePlot, parentKey: string): ExtractedFeature {
  return {
    x: plot.spec.x,
    y: plot.spec.y,
    extent: { width: plot.rect.width, height: plot.rect.depth },
    label: spokenProgramName(plot.spec.program),
    rank: RANK_DETAIL,
    parentKey,
    linkKeys: [],
  };
}

function plotAnchorInRect(plot: VillagePlot, rect: WorldRect): boolean {
  const { x, y } = plot.spec;
  return x >= rect.minX && x <= rect.maxX && y >= rect.minY && y <= rect.maxY;
}

function grownBy(rect: WorldRect, tiles: number): WorldRect {
  return {
    minX: rect.minX - tiles,
    minY: rect.minY - tiles,
    maxX: rect.maxX + tiles,
    maxY: rect.maxY + tiles,
  };
}

function layoutKnobsOf(node: NodeInstance): VillageLayoutKnobs {
  return {
    radius: node.params.radius as number,
    plotCells: node.params.plotCells as number,
    streetWidth: node.params.streetWidth as number,
    weights: PROGRAM_CATALOG.map((def) => node.params[weightKnobName(def.name)] as number),
  };
}

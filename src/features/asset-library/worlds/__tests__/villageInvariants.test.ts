import { buildingPointOf, specOfBuildingPoint } from '../assembly/buildingPoint';
import { CHUNK_SIZE } from '../chunk';
import { PipelineEvaluator } from '../eval/evaluator';
import { villageHashSeedAt } from '../nodes/village/villageHashSeed';
import {
  layoutForCenter,
  planCoversPlazaCell,
  planCoversStreetCell,
  type VillageLayoutKnobs,
  type VillagePlan,
} from '../nodes/village/villageLayout';
import { DEFAULT_PROGRAM_WEIGHTS } from '../nodes/village/villagePlotPrograms';
import type { PipelineState } from '../pipeline/pipelineState';
import { PipelineStore } from '../pipeline/pipelineStore';
import { sanitizePipeline } from '../pipeline/sanitizePipeline';
import { EMPTY_TILE, type WorldPoint } from '../values/chunkValues';
import { asPoints, asTiles } from '../values/valueAccess';
import { checkBuildingAssemblyInvariants } from './buildingAssemblyInvariants.test';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';

const LAYOUT_KNOBS: VillageLayoutKnobs = {
  radius: 40,
  plotCells: 14,
  streetWidth: 3,
  weights: DEFAULT_PROGRAM_WEIGHTS,
};

const CENTER_SPACING = 96;
const SAMPLED_CHUNK_SPAN = 2;
const SAMPLED_CENTERS = [
  { x: 0, y: 0 },
  { x: 37, y: -19 },
  { x: -64, y: 96 },
];

export function checkVillageInvariants(check: CheckReporter): void {
  checkBuildingAssemblyInvariants(check);
  checkOneCenterAlwaysPlansTheSameVillage(check);
  checkPlotsKeepOffTheStreets(check);
  checkVillageNodesAgreeAndStayDeterministic(check);
  checkCentersKeepTheirSpacing(check);
}

function checkOneCenterAlwaysPlansTheSameVillage(check: CheckReporter): void {
  check(
    'planning the same village center twice lays out the same streets and plots',
    SAMPLED_CENTERS.every((center) => JSON.stringify(planAt(center)) === JSON.stringify(planAt(center))),
  );
  check(
    'a village plans a main street, a plaza and plots to line them with',
    SAMPLED_CENTERS.every((center) => planAt(center).streets.length > 0 && planAt(center).plots.length > 0),
  );
  check(
    'every plot a village plans survives the round trip through its world point payload',
    SAMPLED_CENTERS.every((center) =>
      planAt(center).plots.every(
        (plot) =>
          JSON.stringify(specOfBuildingPoint(buildingPointOf(plot.spec))) ===
          JSON.stringify(plot.spec),
      ),
    ),
  );
}

function checkPlotsKeepOffTheStreets(check: CheckReporter): void {
  check(
    'no village plot is laid over a cell its own streets or plaza pave',
    SAMPLED_CENTERS.every((center) => plotsAvoidPaving(planAt(center))),
  );
}

function plotsAvoidPaving(plan: VillagePlan): boolean {
  return plan.plots.every((plot) =>
    everyCellOfRect(plot.rect, (x, y) => !planCoversStreetCell(plan, x, y) && !planCoversPlazaCell(plan, x, y)),
  );
}

function everyCellOfRect(
  rect: { x: number; y: number; width: number; depth: number },
  holds: (x: number, y: number) => boolean,
): boolean {
  for (let y = rect.y; y < rect.y + rect.depth; y++) {
    for (let x = rect.x; x < rect.x + rect.width; x++) if (!holds(x, y)) return false;
  }
  return true;
}

function checkVillageNodesAgreeAndStayDeterministic(check: CheckReporter): void {
  const forward = evaluatorOf(villageState());
  const reversed = evaluatorOf(villageState());
  const forwardChunks = [pointsBytes(forward, 0, 0), pointsBytes(forward, 1, -1)];
  const reversedChunks = [pointsBytes(reversed, 1, -1), pointsBytes(reversed, 0, 0)];
  check(
    'village plots are the same whichever chunk is generated first',
    forwardChunks[0] === reversedChunks[1] && forwardChunks[1] === reversedChunks[0],
  );
  check(
    'village streets are the same whichever chunk is generated first',
    streetBytes(forward, 0, 0) === streetBytes(reversed, 0, 0) &&
      streetBytes(forward, 1, -1) === streetBytes(reversed, 1, -1),
  );
  checkStreetsAndPlotsAgree(check, forward);
}

function checkStreetsAndPlotsAgree(check: CheckReporter, evaluator: PipelineEvaluator): void {
  const paved: string[] = [];
  let planted = 0;
  for (let chunkY = -SAMPLED_CHUNK_SPAN; chunkY <= SAMPLED_CHUNK_SPAN; chunkY++) {
    for (let chunkX = -SAMPLED_CHUNK_SPAN; chunkX <= SAMPLED_CHUNK_SPAN; chunkX++) {
      paved.push(...plotsStandingOnPaving(evaluator, chunkX, chunkY));
      planted += plotsIn(evaluator, chunkX, chunkY).length;
    }
  }
  check('no village building is planted on a cell the streets node paves', paved.length === 0);
  check('the village nodes plant buildings at all, so agreeing about them means something', planted > 0);
}

function plotsStandingOnPaving(
  evaluator: PipelineEvaluator,
  chunkX: number,
  chunkY: number,
): string[] {
  const streets = asTiles(evaluator.valueFor('streets', chunkX, chunkY));
  if (!streets) return [];
  return plotsIn(evaluator, chunkX, chunkY)
    .filter((plot) => streets[cellIndexOf(plot, chunkX, chunkY)] !== EMPTY_TILE)
    .map((plot) => `${plot.x},${plot.y}`);
}

function cellIndexOf(point: WorldPoint, chunkX: number, chunkY: number): number {
  return (point.y - chunkY * CHUNK_SIZE) * CHUNK_SIZE + (point.x - chunkX * CHUNK_SIZE);
}

function checkCentersKeepTheirSpacing(check: CheckReporter): void {
  const centers = centersAcrossChunks(evaluatorOf(villageState()), SAMPLED_CHUNK_SPAN);
  const tooClose = centers.filter((center, index) =>
    centers.slice(index + 1).some((other) => squaredDistance(center, other) < CENTER_SPACING * CENTER_SPACING),
  );
  check('no two village centers are founded inside one another spacing', tooClose.length === 0);
  check('the sampled region founds villages at all', centers.length > 0);
}

function squaredDistance(a: WorldPoint, b: WorldPoint): number {
  return (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y);
}

function centersAcrossChunks(evaluator: PipelineEvaluator, span: number): WorldPoint[] {
  const centers: WorldPoint[] = [];
  for (let chunkY = -span; chunkY <= span; chunkY++) {
    for (let chunkX = -span; chunkX <= span; chunkX++) {
      centers.push(...(asPoints(evaluator.valueFor('centers', chunkX, chunkY)) ?? []));
    }
  }
  return centers;
}

function plotsIn(evaluator: PipelineEvaluator, chunkX: number, chunkY: number): WorldPoint[] {
  return asPoints(evaluator.valueFor('plots', chunkX, chunkY)) ?? [];
}

function pointsBytes(evaluator: PipelineEvaluator, chunkX: number, chunkY: number): string {
  return JSON.stringify(plotsIn(evaluator, chunkX, chunkY));
}

function streetBytes(evaluator: PipelineEvaluator, chunkX: number, chunkY: number): string {
  return JSON.stringify(Array.from(asTiles(evaluator.valueFor('streets', chunkX, chunkY)) ?? []));
}

function planAt(center: { x: number; y: number }): VillagePlan {
  return layoutForCenter(villageHashSeedAt(center.x, center.y), center, LAYOUT_KNOBS);
}

function evaluatorOf(state: PipelineState): PipelineEvaluator {
  return new PipelineEvaluator(new PipelineStore(state));
}

function villageState(): PipelineState {
  return sanitizePipeline({
    seed: 11,
    nodes: [
      { id: 'flat', type: 'constantField', params: { value: 0.6 }, inputs: {} },
      { id: 'travel', type: 'travelCostField', params: { seaLevel: 0.2 }, inputs: { elevation: 'flat' } },
      {
        id: 'centers',
        type: 'settlementSpread',
        params: { landfallPitch: 512, spacing: CENTER_SPACING, minScore: 0, spreadSpeed: 3 },
        inputs: { habitability: 'flat', travelCost: 'travel' },
      },
      { id: 'plots', type: 'villagePlots', params: layoutParams(), inputs: { centers: 'centers' } },
      {
        id: 'streets',
        type: 'villageStreets',
        params: { ...layoutParams(), streetTile: 1, plazaTile: 2 },
        inputs: { centers: 'centers' },
      },
    ],
  });
}

function layoutParams(): Record<string, number> {
  return { radius: LAYOUT_KNOBS.radius, plotCells: LAYOUT_KNOBS.plotCells, streetWidth: LAYOUT_KNOBS.streetWidth };
}

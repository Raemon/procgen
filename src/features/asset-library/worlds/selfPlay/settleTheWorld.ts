import { nodeTypeOf } from '../nodeRegistry';
import { outputKindOf } from '../nodeType';
import type { NodeInstance, PipelineState } from '../pipeline/pipelineState';
import type { RandomStream } from '../random/mulberry32';
import { chance, pick, rollBetween, snappedToStep } from '../randomize/randomRolls';

const SETTLING_CHANCE = 0.35;
const SPARSEST_BUILDINGS = 0.002;
const DENSEST_BUILDINGS = 0.012;

export function settledPipeline(
  state: PipelineState,
  rng: RandomStream,
  cultureId: number,
): PipelineState {
  const sites = state.nodes.filter(nodeMakesPoints);
  if (sites.length === 0 || !chance(rng, SETTLING_CHANCE)) return state;
  raiseBuildingsOn(pick(rng, sites), rng, cultureId);
  return state;
}

function raiseBuildingsOn(node: NodeInstance, rng: RandomStream, cultureId: number): void {
  node.display = { mode: 'structures', cultureId };
  if (typeof node.params.density === 'number') node.params.density = buildingDensity(rng);
}

function buildingDensity(rng: RandomStream): number {
  return snappedToStep(rollBetween(rng, SPARSEST_BUILDINGS, DENSEST_BUILDINGS), 0, 1, 0.001);
}

function nodeMakesPoints(node: NodeInstance): boolean {
  const def = nodeTypeOf(node.type);
  return def !== undefined && outputKindOf(def, node.params) === 'points';
}

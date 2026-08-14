import type { RandomStream } from '../random/mulberry32';
import { DEFAULT_DAYLIGHT, type NodeInstance, type PipelineState } from '../pipeline/pipelineState';
import { dropInvalidWires } from '../pipeline/wiringRules';
import { PRESENT } from '../time/worldTime';
import { groundRecipeNodes } from './groundRecipes';
import { addRandomNode } from './pipelineMutations';
import { rollInt } from './randomRolls';

const FEWEST_FREE_NODES = 1;
const MOST_FREE_NODES = 6;

export function anyNodePipeline(rng: RandomStream, tileIds: readonly number[]): PipelineState {
  const state: PipelineState = {
    seed: rollInt(rng, 1, 999_999),
    daylight: DEFAULT_DAYLIGHT,
    time: PRESENT,
    nodes: groundToBuildOn(rng, tileIds),
  };
  growFreeNodes(state, rng, tileIds);
  dropInvalidWires(state);
  return state;
}

function groundToBuildOn(rng: RandomStream, tileIds: readonly number[]): NodeInstance[] {
  return groundRecipeNodes(rng, tileIds);
}

function growFreeNodes(
  state: PipelineState,
  rng: RandomStream,
  tileIds: readonly number[],
): void {
  const wanted = rollInt(rng, FEWEST_FREE_NODES, MOST_FREE_NODES);
  for (let grown = 0; grown < wanted; grown++) addRandomNode(state, rng, tileIds);
}

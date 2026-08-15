import type { RandomStream } from '../random/mulberry32';
import { DEFAULT_DAYLIGHT, type NodeInstance, type PipelineState } from '../pipeline/pipelineState';
import { dropInvalidWires } from '../pipeline/wiringRules';
import { PRESENT } from '../time/worldTime';
import { groundRecipeNodes } from './groundRecipes';
import { addRandomNode } from './pipelineMutations';
import type { RecipeTiles } from './recipeTiles';
import { rollInt } from './randomRolls';

const FEWEST_FREE_NODES = 1;
const MOST_FREE_NODES = 6;

export function anyNodePipeline(rng: RandomStream, tiles: RecipeTiles): PipelineState {
  const state: PipelineState = {
    seed: rollInt(rng, 1, 999_999),
    daylight: DEFAULT_DAYLIGHT,
    time: PRESENT,
    nodes: groundToBuildOn(rng, tiles),
  };
  growFreeNodes(state, rng, tiles);
  dropInvalidWires(state);
  return state;
}

function groundToBuildOn(rng: RandomStream, tiles: RecipeTiles): NodeInstance[] {
  return groundRecipeNodes(rng, tiles);
}

function growFreeNodes(
  state: PipelineState,
  rng: RandomStream,
  tiles: RecipeTiles,
): void {
  const wanted = rollInt(rng, FEWEST_FREE_NODES, MOST_FREE_NODES);
  for (let grown = 0; grown < wanted; grown++) addRandomNode(state, rng, tiles.all);
}

import type { RandomStream } from '../random/mulberry32';
import type { PipelineState } from '../pipeline/pipelineState';
import { dropInvalidWires } from '../pipeline/wiringRules';
import { clonedState } from './clonedState';
import { PIPELINE_MUTATIONS } from './pipelineMutations';
import { randomWorldPipeline } from './randomWorldPipeline';
import type { RecipeTiles } from './recipeTiles';
import { rollInt, shuffled } from './randomRolls';

export function permutedNodeCombination(
  state: PipelineState,
  rng: RandomStream,
  tiles: RecipeTiles,
): PipelineState {
  const next = clonedState(state);
  if (next.nodes.length === 0) return { ...next, nodes: randomWorldPipeline(rng, tiles).nodes };
  applyMutations(next, rng, tiles.all, rollInt(rng, 1, 2));
  dropInvalidWires(next);
  return next;
}

function applyMutations(
  state: PipelineState,
  rng: RandomStream,
  tileIds: readonly number[],
  count: number,
): void {
  for (let i = 0; i < count; i++) applyFirstViableMutation(state, rng, tileIds);
}

function applyFirstViableMutation(
  state: PipelineState,
  rng: RandomStream,
  tileIds: readonly number[],
): void {
  for (const mutation of shuffled(rng, PIPELINE_MUTATIONS)) {
    if (mutation(state, rng, tileIds)) return;
  }
}

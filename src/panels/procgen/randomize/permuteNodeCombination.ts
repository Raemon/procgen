import type { RandomStream } from '../../../random/mulberry32';
import type { PipelineState } from '../../../procgen/pipeline/pipelineState';
import { dropInvalidWires } from '../../../procgen/pipeline/wiringRules';
import { clonedState } from './clonedState';
import { PIPELINE_MUTATIONS } from './pipelineMutations';
import { randomWorldPipeline } from './recipes/randomWorldPipeline';
import { rollInt, shuffled } from './randomRolls';

export function permutedNodeCombination(
  state: PipelineState,
  rng: RandomStream,
  tileIds: readonly number[],
): PipelineState {
  const next = clonedState(state);
  if (next.nodes.length === 0) return { ...next, nodes: randomWorldPipeline(rng, tileIds).nodes };
  applyMutations(next, rng, tileIds, rollInt(rng, 1, 2));
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

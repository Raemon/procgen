import type { PipelineState } from '../../../procgen/pipeline/pipelineState';

export function clonedState(state: PipelineState): PipelineState {
  return JSON.parse(JSON.stringify(state)) as PipelineState;
}

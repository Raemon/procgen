import type { AbilityResult } from '../../abilities/ability';
import type { ReadOnlyPipelineStore } from '../../frontend/readOnlyAssets';
import type { PipelineStore } from '../pipeline/pipelineStore';

type PerformOnPipeline = (
  action: string,
  params?: Record<string, unknown>,
) => AbilityResult;

export type PerformOnStore = (
  store: PipelineStore,
  action: string,
  params?: Record<string, unknown>,
) => AbilityResult;

export interface EditedPipeline {
  store: ReadOnlyPipelineStore;
  perform: PerformOnPipeline;
  rendered: boolean;
}

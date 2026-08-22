import type { CommandParams } from '@/features/app-shell/runtime/commands/command';
import type { CommandResult } from '@/features/app-shell/runtime/commands/command';
import type { ReadOnlyPipelineStore } from '@/features/app-shell/runtime/readOnlyAssets';
import type { PipelineStore } from '../pipeline/pipelineStore';

export type PerformOnPipeline = (
  action: string,
  params?: CommandParams,
) => CommandResult;

export type PerformOnStore = (
  store: PipelineStore,
  action: string,
  params?: CommandParams,
) => CommandResult;

export interface EditedPipeline {
  store: ReadOnlyPipelineStore;
  perform: PerformOnPipeline;
  rendered: boolean;
}

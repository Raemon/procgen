import { readJson, writeJson } from '../../persistence/localJsonStore';
import { sanitizePipeline } from './sanitizePipeline';
import type { PipelineState } from './pipelineState';
import type { PipelineStore } from './pipelineStore';

const STORAGE_KEY = 'procgen.pipeline.v1';

export function loadStoredPipeline(): PipelineState {
  return sanitizePipeline(readJson(STORAGE_KEY));
}

export function attachPipelinePersistence(store: PipelineStore): void {
  store.onChange(() => writeJson(STORAGE_KEY, store.snapshot()));
}

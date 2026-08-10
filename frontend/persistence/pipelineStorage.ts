import { readPersistedFile, writePersistedFile } from './repoFileStore';
import { sanitizePipeline } from '../../procgen/pipeline/sanitizePipeline';
import type { PipelineState } from '../../procgen/pipeline/pipelineState';
import type { PipelineStore } from '../../procgen/pipeline/pipelineStore';

const FILE_NAME = 'pipeline';

export function loadStoredPipeline(): PipelineState {
  return sanitizePipeline(readPersistedFile(FILE_NAME));
}

export function attachPipelinePersistence(store: PipelineStore): void {
  store.onChange(() => writePersistedFile(FILE_NAME, store.snapshot()));
}

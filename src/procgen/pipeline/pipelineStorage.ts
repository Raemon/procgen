import { readPersistedFile, writePersistedFile } from '../../persistence/repoFileStore';
import { sanitizePipeline } from './sanitizePipeline';
import type { PipelineState } from './pipelineState';
import type { PipelineStore } from './pipelineStore';

const FILE_NAME = 'pipeline';

export function loadStoredPipeline(): PipelineState {
  return sanitizePipeline(readPersistedFile(FILE_NAME));
}

export function attachPipelinePersistence(store: PipelineStore): void {
  store.onChange(() => writePersistedFile(FILE_NAME, store.snapshot()));
}

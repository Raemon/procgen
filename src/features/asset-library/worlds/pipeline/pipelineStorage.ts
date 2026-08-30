import { readPersistedDocument, writePersistedDocument } from '@/features/app-shell/persistence/persistedDocumentStore';
import { exampleWorldSeeds } from '../seeds/exampleWorldSeeds';
import { sanitizePipeline } from './sanitizePipeline';
import type { PipelineState } from './pipelineState';
import type { PipelineStore } from './pipelineStore';

const FILE_NAME = 'pipeline';

export function loadStoredPipeline(): PipelineState {
  return sanitizePipeline(readPersistedDocument(FILE_NAME) ?? openingWorldSeed());
}

function openingWorldSeed(): PipelineState {
  return exampleWorldSeeds()[0]!.state;
}

export function attachPipelinePersistence(store: PipelineStore): void {
  store.onChange(() => writePersistedDocument(FILE_NAME, store.snapshot()));
}

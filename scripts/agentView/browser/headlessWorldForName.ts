import { examplePipelines } from '@/features/asset-library/worlds/seeds/examplePipelines';
import type { PipelineState } from '@/features/asset-library/worlds/pipeline/pipelineState';
import {
  worldFromDocument,
  worldFromPipelineState,
  worldFromRepoData,
  type HeadlessWorld,
} from '../../headlessWorld';
import { REPO_PIPELINE_WORLD_NAME, type WorldViewRequest } from '../worldViewRequest';

export function headlessWorldForRequest(request: WorldViewRequest): HeadlessWorld {
  if (request.worldDocument) return worldFromDocument(request.worldDocument);
  return headlessWorldForName(request.worldName);
}

export function headlessWorldForName(worldName: string): HeadlessWorld {
  if (worldName === REPO_PIPELINE_WORLD_NAME) return worldFromRepoData();
  return worldFromPipelineState(worldSeedStateNamed(worldName));
}

function worldSeedStateNamed(worldName: string): PipelineState {
  const wanted = comparableName(worldName);
  const seed = examplePipelines().find((entry) => comparableName(entry.name) === wanted);
  if (!seed) throw new Error(`no world seed named ${worldName}`);
  return seed.state as PipelineState;
}

function comparableName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

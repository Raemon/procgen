import { existsSync, readFileSync } from 'node:fs';
import { seedPersistedFile } from '../frontend/persistence/repoFileStore';
import { PipelineEvaluator } from '../procgen/eval/evaluator';
import { PipelineStore } from '../procgen/pipeline/pipelineStore';
import { loadStoredPipeline } from '../procgen/pipeline/pipelineStorage';
import { sanitizePipeline } from '../procgen/pipeline/sanitizePipeline';
import type { PipelineState } from '../procgen/pipeline/pipelineState';
import { WorldSampler } from '../procgen/worldSampler';
import { TileAssets } from '../assets/tiles/tileAssets';

export interface HeadlessWorld {
  tileAssets: TileAssets;
  sampler: WorldSampler;
}

export function worldFromRepoData(): HeadlessWorld {
  seedFromRepoData('tiles');
  seedFromRepoData('pipeline');
  return worldAround(new PipelineStore(loadStoredPipeline()));
}

export function worldFromPipelineState(state: PipelineState): HeadlessWorld {
  seedFromRepoData('tiles');
  return worldAround(new PipelineStore(sanitizePipeline(state)));
}

function seedFromRepoData(name: string): void {
  const path = `data/${name}.json`;
  if (!existsSync(path)) return;
  seedPersistedFile(name, JSON.parse(readFileSync(path, 'utf8')));
}

function worldAround(store: PipelineStore): HeadlessWorld {
  const tileAssets = new TileAssets();
  return { tileAssets, sampler: new WorldSampler(store, new PipelineEvaluator(store), tileAssets) };
}

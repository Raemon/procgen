import { existsSync, readFileSync } from 'node:fs';
import { seedPersistedFile } from '../frontend/persistence/repoFileStore';
import { PipelineEvaluator } from '../procgen/eval/evaluator';
import { PipelineStore } from '../procgen/pipeline/pipelineStore';
import { loadStoredPipeline } from '../frontend/persistence/pipelineStorage';
import { sanitizePipeline } from '../procgen/pipeline/sanitizePipeline';
import type { PipelineState } from '../procgen/pipeline/pipelineState';
import { WorldSampler } from '../procgen/worldSampler';
import { CultureAssets } from '../assets/cultures/cultureAssets';
import { PieceAssets } from '../assets/pieces/pieceAssets';
import { TileAssets } from '../assets/tiles/tileAssets';
import { NO_ITEMS } from '../assets/items/itemAssets';
import { TakenItemSpawns } from '../assets/items/pickups/takenItemSpawns';

export interface HeadlessWorld {
  tileAssets: TileAssets;
  pieceAssets: PieceAssets;
  cultureAssets: CultureAssets;
  store: PipelineStore;
  evaluator: PipelineEvaluator;
  sampler: WorldSampler;
}

const SEEDED_ASSET_FILES = ['tiles', 'pieces', 'cultures'];

export function worldFromRepoData(): HeadlessWorld {
  seedAssetFiles();
  seedFromRepoData('pipeline');
  return worldAround(new PipelineStore(loadStoredPipeline()));
}

export function worldFromPipelineState(state: PipelineState): HeadlessWorld {
  seedAssetFiles();
  return worldAround(new PipelineStore(sanitizePipeline(state)));
}

function seedAssetFiles(): void {
  for (const name of SEEDED_ASSET_FILES) seedFromRepoData(name);
}

function seedFromRepoData(name: string): void {
  const path = `data/${name}.json`;
  if (!existsSync(path)) return;
  seedPersistedFile(name, JSON.parse(readFileSync(path, 'utf8')));
}

function worldAround(store: PipelineStore): HeadlessWorld {
  const tileAssets = new TileAssets();
  const pieceAssets = new PieceAssets();
  const cultureAssets = new CultureAssets();
  const evaluator = new PipelineEvaluator(store);
  const sampler = new WorldSampler(
    store,
    evaluator,
    tileAssets,
    pieceAssets,
    NO_ITEMS,
    new TakenItemSpawns(),
    cultureAssets,
  );
  return { tileAssets, pieceAssets, cultureAssets, store, evaluator, sampler };
}

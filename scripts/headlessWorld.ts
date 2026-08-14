import { existsSync, readFileSync } from 'node:fs';
import { seedPersistedFile } from '@/features/app-shell/persistence/repoFileStore';
import { PipelineEvaluator } from '@/features/asset-library/worlds/eval/evaluator';
import { PipelineStore } from '@/features/asset-library/worlds/pipeline/pipelineStore';
import { loadStoredPipeline } from '@/features/asset-library/worlds/pipeline/pipelineStorage';
import { sanitizePipeline } from '@/features/asset-library/worlds/pipeline/sanitizePipeline';
import type { PipelineState } from '@/features/asset-library/worlds/pipeline/pipelineState';
import { WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import { CultureAssets } from '@/features/asset-library/cultures/cultureAssets';
import { PieceAssets } from '@/features/asset-library/pieces/pieceAssets';
import { TileAssets } from '@/features/asset-library/tiles/tileAssets';
import { NO_ITEMS } from '@/features/asset-library/items/itemAssets';
import { TakenItemSpawns } from '@/features/asset-library/items/pickups/takenItemSpawns';

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

export interface WorldDocument {
  name: string;
  pipeline: unknown;
  tiles: unknown;
  pieces: unknown;
  cultures: unknown;
}

export function worldFromDocument(document: WorldDocument): HeadlessWorld {
  seedAssetFiles();
  seedPersistedFile('tiles', document.tiles);
  seedPersistedFile('pieces', document.pieces);
  seedPersistedFile('cultures', document.cultures);
  return worldAround(new PipelineStore(sanitizePipeline(document.pipeline)));
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

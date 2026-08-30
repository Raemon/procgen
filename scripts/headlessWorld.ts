import { holdPersistedDocument } from '@/features/app-shell/persistence/persistedDocumentStore';
import { PipelineEvaluator } from '@/features/asset-library/worlds/eval/evaluator';
import { PipelineStore } from '@/features/asset-library/worlds/pipeline/pipelineStore';
import { loadStoredPipeline } from '@/features/asset-library/worlds/pipeline/pipelineStorage';
import { sanitizePipeline } from '@/features/asset-library/worlds/pipeline/sanitizePipeline';
import type { PipelineState } from '@/features/asset-library/worlds/pipeline/pipelineState';
import { WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import { CreatureAssets } from '@/features/asset-library/creatures/creatureAssets';
import { CultureAssets } from '@/features/asset-library/cultures/cultureAssets';
import { PieceAssets } from '@/features/asset-library/pieces/pieceAssets';
import { TileAssets } from '@/features/asset-library/tiles/tileAssets';
import { NO_ITEMS } from '@/features/asset-library/items/itemAssets';
import { TakenItemSpawns } from '@/features/asset-library/items/pickups/takenItemSpawns';

export interface HeadlessWorld {
  tileAssets: TileAssets;
  pieceAssets: PieceAssets;
  cultureAssets: CultureAssets;
  creatureAssets: CreatureAssets;
  store: PipelineStore;
  evaluator: PipelineEvaluator;
  sampler: WorldSampler;
}

export function worldTheAppOpensWith(): HeadlessWorld {
  return worldAround(new PipelineStore(loadStoredPipeline()));
}

export function worldFromPipelineState(state: PipelineState): HeadlessWorld {
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
  holdPersistedDocument('tiles', document.tiles);
  holdPersistedDocument('pieces', document.pieces);
  holdPersistedDocument('cultures', document.cultures);
  return worldAround(new PipelineStore(sanitizePipeline(document.pipeline)));
}

function worldAround(store: PipelineStore): HeadlessWorld {
  const tileAssets = new TileAssets();
  const pieceAssets = new PieceAssets();
  const cultureAssets = new CultureAssets();
  const creatureAssets = new CreatureAssets();
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
  return { tileAssets, pieceAssets, cultureAssets, creatureAssets, store, evaluator, sampler };
}

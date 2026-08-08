import { headlessServerWorld } from '../api/agent/headless/headlessServerWorld';
import { storedJsonFromRepoDataFiles } from '../api/agent/headless/storedJsonFromRepoDataFiles';
import type { ServerWorld } from '../api/agent/serverWorld';
import type { PipelineEvaluator } from '../procgen/eval/evaluator';
import type { PipelineState } from '../procgen/pipeline/pipelineState';
import type { PipelineStore } from '../procgen/pipeline/pipelineStore';
import type { WorldSampler } from '../procgen/worldSampler';
import type { CultureAssets } from '../assets/cultures/cultureAssets';
import type { PieceAssets } from '../assets/pieces/pieceAssets';
import type { TileAssets } from '../assets/tiles/tileAssets';

export interface HeadlessWorld {
  tileAssets: TileAssets;
  pieceAssets: PieceAssets;
  cultureAssets: CultureAssets;
  store: PipelineStore;
  evaluator: PipelineEvaluator;
  sampler: WorldSampler;
}

export function worldFromRepoData(): HeadlessWorld {
  return headlessWorldParts(headlessServerWorld(storedJsonFromRepoDataFiles()));
}

export function worldFromPipelineState(state: PipelineState): HeadlessWorld {
  return headlessWorldParts(
    headlessServerWorld(storedJsonFromRepoDataFiles({ pipeline: state })),
  );
}

function headlessWorldParts(world: ServerWorld): HeadlessWorld {
  return {
    tileAssets: world.tileAssets,
    pieceAssets: world.pieces,
    cultureAssets: world.cultures,
    store: world.store,
    evaluator: world.evaluator,
    sampler: world.sampler,
  };
}

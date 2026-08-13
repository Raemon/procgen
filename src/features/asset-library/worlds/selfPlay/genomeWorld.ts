import { TileAssets } from '@/features/asset-library/tiles/tileAssets';
import { PipelineEvaluator } from '../eval/evaluator';
import { PipelineStore } from '../pipeline/pipelineStore';
import { WorldSampler } from '../worldSampler';
import { cultureOfPalette, piecesOfPalette } from './paletteAssetSources';
import type { WorldGenome } from './worldGenome';
import { worldPaletteOfKit, type WorldPalette } from './worldPalette';

export interface GenomeWorld {
  palette: WorldPalette;
  tileAssets: TileAssets;
  sampler: WorldSampler;
}

export function worldOfGenome(genome: WorldGenome): GenomeWorld {
  const palette = worldPaletteOfKit(genome.kitSeed, genome.accentKitSeed, genome.paletteSize);
  const tileAssets = new TileAssets(palette.tiles.map((tile) => ({ ...tile })));
  const store = new PipelineStore(structuredClone(genome.pipeline));
  return { palette, tileAssets, sampler: samplerOf(store, tileAssets, palette) };
}

function samplerOf(
  store: PipelineStore,
  tileAssets: TileAssets,
  palette: WorldPalette,
): WorldSampler {
  return new WorldSampler(
    store,
    new PipelineEvaluator(store),
    tileAssets,
    piecesOfPalette(palette),
    undefined,
    undefined,
    cultureOfPalette(palette),
  );
}

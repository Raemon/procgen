import { TileAssets } from '@/features/asset-library/tiles/tileAssets';
import { PipelineEvaluator } from '../eval/evaluator';
import { PipelineStore } from '../pipeline/pipelineStore';
import { WorldSampler } from '../worldSampler';
import type { WorldGenome } from './worldGenome';
import { worldPaletteOfKit, type WorldPalette } from './worldPalette';

export interface GenomeWorld {
  palette: WorldPalette;
  tileAssets: TileAssets;
  sampler: WorldSampler;
}

export function worldOfGenome(genome: WorldGenome): GenomeWorld {
  const palette = worldPaletteOfKit(genome.kitSeed, genome.paletteSize);
  const tileAssets = new TileAssets(palette.tiles.map((tile) => ({ ...tile })));
  const store = new PipelineStore(structuredClone(genome.pipeline));
  return {
    palette,
    tileAssets,
    sampler: new WorldSampler(store, new PipelineEvaluator(store), tileAssets),
  };
}

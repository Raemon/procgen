import type { RandomStream } from '../random/mulberry32';
import { sanitizePipeline } from '../pipeline/sanitizePipeline';
import { clonedState } from '../randomize/clonedState';
import { permutedNodeCombination } from '../randomize/permuteNodeCombination';
import { permutedSliderParams } from '../randomize/permuteSliderParams';
import { clamped, pick, rollInt } from '../randomize/randomRolls';
import {
  LARGEST_PALETTE,
  rolledPipeline,
  SMALLEST_PALETTE,
  type WorldGenome,
} from './worldGenome';
import { settledPipeline } from './settleTheWorld';
import { worldPaletteOfKit, type WorldPalette } from './worldPalette';

type GenomeMutation = (genome: WorldGenome, rng: RandomStream) => WorldGenome;

const GENOME_MUTATIONS: readonly GenomeMutation[] = [
  nudgedKnobs,
  permutedNodes,
  rerolledWorldSeed,
  swappedAssetKit,
  resizedPalette,
  regrownPipeline,
  settledBuildings,
];

const MOST_MUTATIONS_AT_ONCE = 2;

export function mutatedGenome(genome: WorldGenome, rng: RandomStream): WorldGenome {
  let mutated = genome;
  for (let applied = 0; applied < rollInt(rng, 1, MOST_MUTATIONS_AT_ONCE); applied++) {
    mutated = pick(rng, GENOME_MUTATIONS)(mutated, rng);
  }
  return { ...mutated, pipeline: sanitizePipeline(mutated.pipeline) };
}

function nudgedKnobs(genome: WorldGenome, rng: RandomStream): WorldGenome {
  return { ...genome, pipeline: permutedSliderParams(genome.pipeline, rng) };
}

function permutedNodes(genome: WorldGenome, rng: RandomStream): WorldGenome {
  return {
    ...genome,
    pipeline: permutedNodeCombination(genome.pipeline, rng, paletteIdsOf(genome)),
  };
}

function rerolledWorldSeed(genome: WorldGenome, rng: RandomStream): WorldGenome {
  return { ...genome, pipeline: { ...genome.pipeline, seed: rollInt(rng, 1, 999_999) } };
}

function swappedAssetKit(genome: WorldGenome, rng: RandomStream): WorldGenome {
  return { ...genome, kitSeed: rollInt(rng, 1, 999_999) };
}

function resizedPalette(genome: WorldGenome, rng: RandomStream): WorldGenome {
  const resized = genome.paletteSize + pick(rng, [-2, -1, 1, 2]);
  return { ...genome, paletteSize: clamped(resized, SMALLEST_PALETTE, LARGEST_PALETTE) };
}

function regrownPipeline(genome: WorldGenome, rng: RandomStream): WorldGenome {
  const palette = paletteOf(genome);
  return { ...genome, pipeline: rolledPipeline(rng, palette.paletteIds, palette.culture.id) };
}

function settledBuildings(genome: WorldGenome, rng: RandomStream): WorldGenome {
  const pipeline = settledPipeline(clonedState(genome.pipeline), rng, paletteOf(genome).culture.id);
  return { ...genome, pipeline };
}

function paletteIdsOf(genome: WorldGenome): number[] {
  return paletteOf(genome).paletteIds;
}

function paletteOf(genome: WorldGenome): WorldPalette {
  return worldPaletteOfKit(genome.kitSeed, genome.paletteSize);
}

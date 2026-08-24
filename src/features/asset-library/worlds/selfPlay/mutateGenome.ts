import type { TileId } from '@/features/asset-library/asset';
import type { RandomStream } from '../random/mulberry32';
import { nodeTypeOf } from '../nodeRegistry';
import { sanitizePipeline } from '../pipeline/sanitizePipeline';
import { clonedState } from '../randomize/clonedState';
import { permutedNodeCombination } from '../randomize/permuteNodeCombination';
import { permutedSliderParams } from '../randomize/permuteSliderParams';
import { recipeTilesOf, type RecipeTiles } from '../randomize/recipeTiles';
import { chance, clamped, pick, rollInt } from '../randomize/randomRolls';
import {
  LARGEST_PALETTE,
  rolledPipeline,
  SMALLEST_PALETTE,
  type WorldSeedGenome,
} from './worldSeedGenome';
import { settledPipeline } from './settleTheWorld';
import { worldPaletteOfKit, type WorldPalette } from './worldPalette';

type GenomeMutation = (genome: WorldSeedGenome, rng: RandomStream) => WorldSeedGenome;

const GENOME_MUTATIONS: readonly GenomeMutation[] = [
  nudgedKnobs,
  permutedNodes,
  repaintedTiles,
  rerolledWorldSeed,
  swappedAssetKit,
  swappedAccentKit,
  resizedPalette,
  regrownPipeline,
  settledBuildings,
];

const MOST_MUTATIONS_AT_ONCE = 2;

export function mutatedGenome(genome: WorldSeedGenome, rng: RandomStream): WorldSeedGenome {
  let mutated = genome;
  for (let applied = 0; applied < rollInt(rng, 1, MOST_MUTATIONS_AT_ONCE); applied++) {
    mutated = pick(rng, GENOME_MUTATIONS)(mutated, rng);
  }
  return { ...mutated, pipeline: sanitizePipeline(mutated.pipeline) };
}

function nudgedKnobs(genome: WorldSeedGenome, rng: RandomStream): WorldSeedGenome {
  return { ...genome, pipeline: permutedSliderParams(genome.pipeline, rng) };
}

function permutedNodes(genome: WorldSeedGenome, rng: RandomStream): WorldSeedGenome {
  return {
    ...genome,
    pipeline: permutedNodeCombination(genome.pipeline, rng, recipeTilesFor(genome)),
  };
}

function rerolledWorldSeed(genome: WorldSeedGenome, rng: RandomStream): WorldSeedGenome {
  return { ...genome, pipeline: { ...genome.pipeline, seed: rollInt(rng, 1, 999_999) } };
}

function repaintedTiles(genome: WorldSeedGenome, rng: RandomStream): WorldSeedGenome {
  const pipeline = clonedState(genome.pipeline);
  const painted = pipeline.nodes.filter(nodeLinksTiles);
  if (painted.length === 0) return { ...genome, pipeline };
  repaintNode(pick(rng, painted), rng, paletteIdsOf(genome));
  return { ...genome, pipeline };
}

function nodeLinksTiles(node: WorldSeedGenome['pipeline']['nodes'][number]): boolean {
  const def = nodeTypeOf(node.type);
  return Object.values(def?.params ?? {}).some((spec) => spec.kind === 'tile');
}

function repaintNode(
  node: WorldSeedGenome['pipeline']['nodes'][number],
  rng: RandomStream,
  tileIds: readonly TileId[],
): void {
  const def = nodeTypeOf(node.type);
  for (const [name, spec] of Object.entries(def?.params ?? {})) {
    if (spec.kind === 'tile' && chance(rng, 0.6)) node.params[name] = repaintedTileId(rng, tileIds);
  }
}

function repaintedTileId(rng: RandomStream, tileIds: readonly TileId[]): number {
  if (tileIds.length === 0 || chance(rng, 0.15)) return -1;
  return pick(rng, tileIds);
}

function swappedAssetKit(genome: WorldSeedGenome, rng: RandomStream): WorldSeedGenome {
  return { ...genome, kitSeed: rollInt(rng, 1, 999_999) };
}

function swappedAccentKit(genome: WorldSeedGenome, rng: RandomStream): WorldSeedGenome {
  return { ...genome, accentKitSeed: rollInt(rng, 1, 999_999) };
}

function resizedPalette(genome: WorldSeedGenome, rng: RandomStream): WorldSeedGenome {
  const resized = genome.paletteSize + pick(rng, [-2, -1, 1, 2]);
  return { ...genome, paletteSize: clamped(resized, SMALLEST_PALETTE, LARGEST_PALETTE) };
}

function regrownPipeline(genome: WorldSeedGenome, rng: RandomStream): WorldSeedGenome {
  const palette = paletteOf(genome);
  return {
    ...genome,
    pipeline: rolledPipeline(rng, recipeTilesOf(palette.tiles, palette.paletteIds), palette.culture.id),
  };
}

function settledBuildings(genome: WorldSeedGenome, rng: RandomStream): WorldSeedGenome {
  const pipeline = settledPipeline(clonedState(genome.pipeline), rng, paletteOf(genome).culture.id);
  return { ...genome, pipeline };
}

function paletteIdsOf(genome: WorldSeedGenome): TileId[] {
  return paletteOf(genome).paletteIds;
}

function recipeTilesFor(genome: WorldSeedGenome): RecipeTiles {
  const palette = paletteOf(genome);
  return recipeTilesOf(palette.tiles, palette.paletteIds);
}

function paletteOf(genome: WorldSeedGenome): WorldPalette {
  return worldPaletteOfKit(genome.kitSeed, genome.accentKitSeed, genome.paletteSize);
}

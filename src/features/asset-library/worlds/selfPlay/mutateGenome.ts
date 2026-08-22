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
  type WorldGenome,
} from './worldGenome';
import { settledPipeline } from './settleTheWorld';
import { worldPaletteOfKit, type WorldPalette } from './worldPalette';

type GenomeMutation = (genome: WorldGenome, rng: RandomStream) => WorldGenome;

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
    pipeline: permutedNodeCombination(genome.pipeline, rng, recipeTilesFor(genome)),
  };
}

function rerolledWorldSeed(genome: WorldGenome, rng: RandomStream): WorldGenome {
  return { ...genome, pipeline: { ...genome.pipeline, seed: rollInt(rng, 1, 999_999) } };
}

function repaintedTiles(genome: WorldGenome, rng: RandomStream): WorldGenome {
  const pipeline = clonedState(genome.pipeline);
  const painted = pipeline.nodes.filter(nodeLinksTiles);
  if (painted.length === 0) return { ...genome, pipeline };
  repaintNode(pick(rng, painted), rng, paletteIdsOf(genome));
  return { ...genome, pipeline };
}

function nodeLinksTiles(node: WorldGenome['pipeline']['nodes'][number]): boolean {
  const def = nodeTypeOf(node.type);
  return Object.values(def?.params ?? {}).some((spec) => spec.kind === 'tile');
}

function repaintNode(
  node: WorldGenome['pipeline']['nodes'][number],
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

function swappedAssetKit(genome: WorldGenome, rng: RandomStream): WorldGenome {
  return { ...genome, kitSeed: rollInt(rng, 1, 999_999) };
}

function swappedAccentKit(genome: WorldGenome, rng: RandomStream): WorldGenome {
  return { ...genome, accentKitSeed: rollInt(rng, 1, 999_999) };
}

function resizedPalette(genome: WorldGenome, rng: RandomStream): WorldGenome {
  const resized = genome.paletteSize + pick(rng, [-2, -1, 1, 2]);
  return { ...genome, paletteSize: clamped(resized, SMALLEST_PALETTE, LARGEST_PALETTE) };
}

function regrownPipeline(genome: WorldGenome, rng: RandomStream): WorldGenome {
  const palette = paletteOf(genome);
  return {
    ...genome,
    pipeline: rolledPipeline(rng, recipeTilesOf(palette.tiles, palette.paletteIds), palette.culture.id),
  };
}

function settledBuildings(genome: WorldGenome, rng: RandomStream): WorldGenome {
  const pipeline = settledPipeline(clonedState(genome.pipeline), rng, paletteOf(genome).culture.id);
  return { ...genome, pipeline };
}

function paletteIdsOf(genome: WorldGenome): TileId[] {
  return paletteOf(genome).paletteIds;
}

function recipeTilesFor(genome: WorldGenome): RecipeTiles {
  const palette = paletteOf(genome);
  return recipeTilesOf(palette.tiles, palette.paletteIds);
}

function paletteOf(genome: WorldGenome): WorldPalette {
  return worldPaletteOfKit(genome.kitSeed, genome.accentKitSeed, genome.paletteSize);
}

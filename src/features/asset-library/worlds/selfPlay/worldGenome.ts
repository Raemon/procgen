import type { RandomStream } from '../random/mulberry32';
import { anyNodePipeline } from '../randomize/anyNodePipeline';
import { randomWorldPipeline } from '../randomize/randomWorldPipeline';
import type { PipelineState } from '../pipeline/pipelineState';
import { sanitizePipeline } from '../pipeline/sanitizePipeline';
import { chance, rollInt } from '../randomize/randomRolls';
import { worldPaletteOfKit } from './worldPalette';

export interface WorldGenome {
  kitSeed: number;
  paletteSize: number;
  pipeline: PipelineState;
}

export const SMALLEST_PALETTE = 3;
export const LARGEST_PALETTE = 9;

export function rolledGenome(rng: RandomStream): WorldGenome {
  const kitSeed = rollInt(rng, 1, 999_999);
  const paletteSize = rollInt(rng, SMALLEST_PALETTE, LARGEST_PALETTE);
  const tileIds = worldPaletteOfKit(kitSeed, paletteSize).paletteIds;
  return { kitSeed, paletteSize, pipeline: rolledPipeline(rng, tileIds) };
}

export function rolledPipeline(rng: RandomStream, tileIds: readonly number[]): PipelineState {
  const rolled = chance(rng, 0.5) ? anyNodePipeline(rng, tileIds) : randomWorldPipeline(rng, tileIds);
  return sanitizePipeline(rolled);
}

export function genomeFromJson(raw: unknown): WorldGenome {
  const stored = (typeof raw === 'object' && raw !== null ? raw : {}) as Partial<WorldGenome>;
  return {
    kitSeed: wholeNumberOr(stored.kitSeed, 1),
    paletteSize: wholeNumberOr(stored.paletteSize, SMALLEST_PALETTE),
    pipeline: sanitizePipeline(stored.pipeline),
  };
}

export function genomeAsJson(genome: WorldGenome): string {
  return `${JSON.stringify(genome, null, 2)}\n`;
}

function wholeNumberOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : fallback;
}

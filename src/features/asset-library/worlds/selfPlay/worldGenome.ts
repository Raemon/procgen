import type { RandomStream } from '../random/mulberry32';
import { anyNodePipeline } from '../randomize/anyNodePipeline';
import { randomWorldPipeline } from '../randomize/randomWorldPipeline';
import { settlementRecipeNodes } from '../randomize/settlementRecipe';
import { DEFAULT_DAYLIGHT, type PipelineState } from '../pipeline/pipelineState';
import { sanitizePipeline } from '../pipeline/sanitizePipeline';
import { PRESENT } from '../time/worldTime';
import { chance, rollInt } from '../randomize/randomRolls';
import { settledPipeline } from './settleTheWorld';
import { worldPaletteOfKit } from './worldPalette';

export interface WorldGenome {
  kitSeed: number;
  accentKitSeed: number;
  paletteSize: number;
  pipeline: PipelineState;
}

export const SMALLEST_PALETTE = 3;
export const LARGEST_PALETTE = 9;

export function rolledGenome(rng: RandomStream): WorldGenome {
  const kitSeed = rollInt(rng, 1, 999_999);
  const accentKitSeed = chance(rng, 0.6) ? rollInt(rng, 1, 999_999) : kitSeed;
  const paletteSize = rollInt(rng, SMALLEST_PALETTE, LARGEST_PALETTE);
  const palette = worldPaletteOfKit(kitSeed, accentKitSeed, paletteSize);
  return {
    kitSeed,
    accentKitSeed,
    paletteSize,
    pipeline: rolledPipeline(rng, palette.paletteIds, palette.culture.id),
  };
}

const SETTLED_ROLL_SHARE = 0.2;

export function rolledPipeline(
  rng: RandomStream,
  tileIds: readonly number[],
  cultureId: number,
): PipelineState {
  if (chance(rng, SETTLED_ROLL_SHARE)) {
    return sanitizePipeline({
      seed: rollInt(rng, 1, 999_999),
      daylight: DEFAULT_DAYLIGHT,
      time: PRESENT,
      nodes: settlementRecipeNodes(rng, tileIds, cultureId),
    });
  }
  const rolled = chance(rng, 0.5) ? anyNodePipeline(rng, tileIds) : randomWorldPipeline(rng, tileIds);
  return settledPipeline(sanitizePipeline(rolled), rng, cultureId);
}

export function genomeFromJson(raw: unknown): WorldGenome {
  const stored = (typeof raw === 'object' && raw !== null ? raw : {}) as Partial<WorldGenome>;
  const kitSeed = wholeNumberOr(stored.kitSeed, 1);
  return {
    kitSeed,
    accentKitSeed: wholeNumberOr(stored.accentKitSeed, kitSeed),
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

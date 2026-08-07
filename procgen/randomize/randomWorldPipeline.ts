import type { RandomStream } from '../random/mulberry32';
import { DEFAULT_DAYLIGHT, type PipelineState } from '../pipeline/pipelineState';
import { mazeRecipeNodes } from './mazeRecipe';
import { chance, rollInt } from './randomRolls';
import { terrainRecipeNodes } from './terrainRecipe';

export function randomWorldPipeline(rng: RandomStream, tileIds: readonly number[]): PipelineState {
  const seed = rollInt(rng, 1, 999_999);
  const nodes = chance(rng, 0.3) ? mazeRecipeNodes(rng, tileIds) : terrainRecipeNodes(rng, tileIds);
  return { seed, daylight: DEFAULT_DAYLIGHT, nodes };
}

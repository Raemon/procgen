import type { RandomStream } from '../random/mulberry32';
import { DEFAULT_DAYLIGHT, type PipelineState } from '../pipeline/pipelineState';
import { PRESENT } from '../time/worldTime';
import { groundRecipeNodes } from './groundRecipes';
import type { RecipeTiles } from './recipeTiles';
import { rollInt } from './randomRolls';

export function randomWorldPipeline(rng: RandomStream, tiles: RecipeTiles): PipelineState {
  const seed = rollInt(rng, 1, 999_999);
  return { seed, daylight: DEFAULT_DAYLIGHT, time: PRESENT, nodes: groundRecipeNodes(rng, tiles) };
}

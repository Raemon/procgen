import type { NodeInstance } from '../pipeline/pipelineState';
import type { RandomStream } from '../random/mulberry32';
import { biomePartitionRecipeNodes } from './biomePartitionRecipe';
import { highlandsRecipeNodes } from './highlandsRecipe';
import { mazeRecipeNodes } from './mazeRecipe';
import { riverlandsRecipeNodes } from './riverlandsRecipe';
import { rollBetween } from './randomRolls';
import { terrainRecipeNodes } from './terrainRecipe';
import { volcanicIsleRecipeNodes } from './volcanicIsleRecipe';

type GroundRecipe = (rng: RandomStream, tileIds: readonly number[]) => NodeInstance[];

const WEIGHED_RECIPES: ReadonlyArray<[GroundRecipe, number]> = [
  [terrainRecipeNodes, 0.22],
  [mazeRecipeNodes, 0.13],
  [riverlandsRecipeNodes, 0.17],
  [volcanicIsleRecipeNodes, 0.1],
  [highlandsRecipeNodes, 0.22],
  [biomePartitionRecipeNodes, 0.16],
];

export function groundRecipeNodes(rng: RandomStream, tileIds: readonly number[]): NodeInstance[] {
  return pickWeighed(rng)(rng, tileIds);
}

function pickWeighed(rng: RandomStream): GroundRecipe {
  const total = WEIGHED_RECIPES.reduce((sum, [, weight]) => sum + weight, 0);
  let remaining = rollBetween(rng, 0, total);
  for (const [recipe, weight] of WEIGHED_RECIPES) {
    remaining -= weight;
    if (remaining <= 0) return recipe;
  }
  return terrainRecipeNodes;
}

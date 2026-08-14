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
  [terrainRecipeNodes, 0.16],
  [mazeRecipeNodes, 0.12],
  [riverlandsRecipeNodes, 0.15],
  [volcanicIsleRecipeNodes, 0.08],
  [highlandsRecipeNodes, 0.27],
  [biomePartitionRecipeNodes, 0.22],
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

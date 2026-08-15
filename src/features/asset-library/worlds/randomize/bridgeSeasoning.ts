import type { NodeInstance } from '../pipeline/pipelineState';
import type { RandomStream } from '../random/mulberry32';
import { pick, rollBetween, rollInt, shuffled, snappedToStep } from './randomRolls';
import { nextRecipeId, recipeNode } from './recipeNode';
import { preferring, type RecipeTiles } from './recipeTiles';

export function appendStraitBridges(
  nodes: NodeInstance[],
  rng: RandomStream,
  tiles: RecipeTiles,
  waterId: string,
  seaLevel: number,
): void {
  nodes.push(
    recipeNode({
      id: nextRecipeId(nodes),
      type: 'straitBridges',
      label: 'bridges',
      params: {
        waterBelow: seaLevel,
        shallowBand: snappedToStep(rollBetween(rng, 0.08, 0.25), 0.02, 0.5, 0.01),
        maxSpan: rollInt(rng, 5, 14),
        pitch: pick(rng, [20, 28, 36, 48]),
        bridgeTile: bridgeTileOf(rng, tiles),
      },
      inputs: { water: waterId },
    }),
  );
}

function bridgeTileOf(rng: RandomStream, tiles: RecipeTiles): number {
  if (tiles.all.length === 0) return -1;
  return shuffled(rng, preferring(tiles, 'walkable'))[0]!;
}

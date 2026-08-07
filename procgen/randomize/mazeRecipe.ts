import type { RandomStream } from '../random/mulberry32';
import { CARVER_CHOICES } from '../nodes/maze/mazeCarvers';
import type { NodeInstance } from '../pipeline/pipelineState';
import { randomMarkerDisplay, randomMarkerTag } from './markerPalette';
import { chance, pick, rollBetween, rollInt, shuffled, snappedToStep } from './randomRolls';
import { nextRecipeId, recipeNode } from './recipeNode';

export function mazeRecipeNodes(rng: RandomStream, tileIds: readonly number[]): NodeInstance[] {
  const nodes: NodeInstance[] = [];
  appendMaze(nodes, rng, tileIds);
  if (chance(rng, 0.45)) appendDwellers(nodes, rng, tileIds);
  return nodes;
}

function appendMaze(nodes: NodeInstance[], rng: RandomStream, tileIds: readonly number[]): void {
  const [wallTile, floorTile] = wallAndFloorTiles(rng, tileIds);
  nodes.push(
    recipeNode({
      id: nextRecipeId(nodes),
      type: 'mazeChunk',
      label: 'labyrinth',
      params: {
        corridor: rollInt(rng, 1, 8),
        wall: rollInt(rng, 1, 3),
        mazeChunks: chance(rng, 0.25) ? rollInt(rng, 2, 4) : 1,
        carver: pick(rng, CARVER_CHOICES).value,
        braid: snappedToStep(rollBetween(rng, 0, 0.6), 0, 1, 0.05),
        doorsPerEdge: rollInt(rng, 1, 3),
        wallTile,
        floorTile,
      },
    }),
  );
}

function wallAndFloorTiles(rng: RandomStream, tileIds: readonly number[]): [number, number] {
  if (tileIds.length === 0) return [-1, -1];
  const pool = shuffled(rng, tileIds);
  return [pool[0]!, pool[1 % pool.length]!];
}

function appendDwellers(nodes: NodeInstance[], rng: RandomStream, tileIds: readonly number[]): void {
  const tag = randomMarkerTag(rng);
  nodes.push(
    recipeNode({
      id: nextRecipeId(nodes),
      type: 'scatterPoints',
      label: `${tag} scatter`,
      params: {
        density: snappedToStep(rollBetween(rng, 0.005, 0.02), 0, 1, 0.005),
        maskAtLeast: 0,
        maskAtMost: 1,
      },
      display: randomMarkerDisplay(rng, tileIds),
    }),
  );
}

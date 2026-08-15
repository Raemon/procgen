import { appendStraitBridges } from './bridgeSeasoning';
import { NOISE_STYLE_FBM, NOISE_STYLE_RIDGED } from '../noise/terrainOctaves';
import type { NodeInstance } from '../pipeline/pipelineState';
import type { RandomStream } from '../random/mulberry32';
import { chance, rollBetween, rollInt, shuffled, snappedToStep } from './randomRolls';
import { nextRecipeId, recipeNode } from './recipeNode';
import { preferring, type RecipeTiles } from './recipeTiles';
import { appendBandLayers, appendScatterLayers } from './terrainRecipe';

export function riverlandsRecipeNodes(rng: RandomStream, tiles: RecipeTiles): NodeInstance[] {
  const nodes: NodeInstance[] = [];
  const seaLevel = snappedToStep(rollBetween(rng, 0.35, 0.5), 0, 1, 0.01);
  const heightId = appendHighlands(nodes, rng);
  const floodedId = appendDrainableSurface(nodes, rng, heightId, seaLevel);
  appendBandLayers(nodes, rng, tiles, heightId);
  const waterTiles = shuffled(rng, preferring(tiles, 'blockers'));
  appendRiver(nodes, rng, waterTiles, heightId, floodedId, seaLevel);
  if (chance(rng, 0.6)) appendLakes(nodes, rng, waterTiles, heightId, floodedId, seaLevel);
  if (chance(rng, 0.65)) appendStraitBridges(nodes, rng, tiles, heightId, seaLevel);
  appendScatterLayers(nodes, rng, tiles, heightId);
  return nodes;
}

function appendHighlands(nodes: NodeInstance[], rng: RandomStream): string {
  const id = nextRecipeId(nodes);
  nodes.push(
    recipeNode({
      id,
      type: 'terrainNoise',
      label: 'highlands',
      params: {
        scale: snappedToStep(rollBetween(rng, 0.006, 0.03), 0.002, 0.2, 0.002),
        style: chance(rng, 0.5) ? NOISE_STYLE_RIDGED : NOISE_STYLE_FBM,
        octaves: rollInt(rng, 4, 7),
      },
      display: { mode: 'elevation', heightScale: snappedToStep(rollBetween(rng, 1.5, 5), 0.5, 8, 0.5) },
    }),
  );
  return id;
}

function appendDrainableSurface(
  nodes: NodeInstance[],
  rng: RandomStream,
  heightId: string,
  seaLevel: number,
): string {
  const id = nextRecipeId(nodes);
  nodes.push(
    recipeNode({
      id,
      type: 'fillDepressions',
      label: 'drainable surface',
      params: { seaLevel, maxFill: snappedToStep(rollBetween(rng, 0.08, 0.3), 0, 0.5, 0.01) },
      inputs: { elevation: heightId },
    }),
  );
  return id;
}

function appendRiver(
  nodes: NodeInstance[],
  rng: RandomStream,
  waterTiles: readonly number[],
  heightId: string,
  floodedId: string,
  seaLevel: number,
): void {
  const flowId = nextRecipeId(nodes);
  nodes.push(
    recipeNode({
      id: flowId,
      type: 'flowAccumulation',
      label: 'drainage',
      params: {
        seaLevel,
        catchmentScale: rollInt(rng, 800, 6000),
        convergence: snappedToStep(rollBetween(rng, 3, 6), 1, 8, 0.5),
      },
      inputs: { elevation: floodedId },
    }),
  );
  nodes.push(
    recipeNode({
      id: nextRecipeId(nodes),
      type: 'riverFromFlow',
      label: 'rivers',
      params: {
        minFlow: snappedToStep(rollBetween(rng, 0.35, 0.65), 0, 1, 0.01),
        maxWidth: rollInt(rng, 2, 6),
        seaLevel,
        riverTile: waterTiles[0] ?? -1,
      },
      inputs: { flow: flowId, elevation: heightId },
    }),
  );
}

function appendLakes(
  nodes: NodeInstance[],
  rng: RandomStream,
  waterTiles: readonly number[],
  heightId: string,
  floodedId: string,
  seaLevel: number,
): void {
  nodes.push(
    recipeNode({
      id: nextRecipeId(nodes),
      type: 'lakeFromFill',
      label: 'lakes',
      params: {
        seaLevel,
        minDepth: snappedToStep(rollBetween(rng, 0.004, 0.02), 0.001, 0.2, 0.001),
        lakeTile: waterTiles[0] ?? -1,
        shallowTile: waterTiles[1 % Math.max(1, waterTiles.length)] ?? -1,
      },
      inputs: { ground: heightId, flooded: floodedId },
    }),
  );
}

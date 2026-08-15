import type { NodeInstance } from '../pipeline/pipelineState';
import type { RandomStream } from '../random/mulberry32';
import { appendStraitBridges } from './bridgeSeasoning';
import { appendBandLayers, appendScatterLayers } from './terrainRecipe';
import { chance, rollBetween, rollInt, snappedToStep } from './randomRolls';
import { nextRecipeId, recipeNode } from './recipeNode';
import type { RecipeTiles } from './recipeTiles';

export function volcanicIsleRecipeNodes(
  rng: RandomStream,
  tiles: RecipeTiles,
): NodeInstance[] {
  const nodes: NodeInstance[] = [];
  const conesId = appendHotspots(nodes, rng);
  const seaLevel = snappedToStep(rollBetween(rng, 0.4, 0.5), 0, 1, 0.01);
  const reliefId = appendConeField(nodes, rng, conesId, seaLevel);
  appendBandLayers(nodes, rng, tiles, reliefId);
  if (chance(rng, 0.7)) appendStraitBridges(nodes, rng, tiles, reliefId, seaLevel);
  appendScatterLayers(nodes, rng, tiles, reliefId);
  return nodes;
}

function appendHotspots(nodes: NodeInstance[], rng: RandomStream): string {
  const id = nextRecipeId(nodes);
  nodes.push(
    recipeNode({
      id,
      type: 'hotspotChain',
      label: 'hotspots',
      params: {
        hotspotSpacing: rollInt(rng, 128, 256),
        coneRadius: rollInt(rng, 40, 90),
        coneHeight: snappedToStep(rollBetween(rng, 0.7, 1), 0, 1, 0.01),
        chainFraction: snappedToStep(rollBetween(rng, 0.2, 0.6), 0, 1, 0.05),
      },
    }),
  );
  return id;
}

function appendConeField(
  nodes: NodeInstance[],
  rng: RandomStream,
  conesId: string,
  seaLevel: number,
): string {
  const id = nextRecipeId(nodes);
  nodes.push(
    recipeNode({
      id,
      type: 'volcanoConeField',
      label: 'isles',
      params: { seaLevel },
      inputs: { volcanoes: conesId },
      display: { mode: 'elevation', heightScale: snappedToStep(rollBetween(rng, 2, 6), 0.5, 8, 0.5) },
    }),
  );
  return id;
}

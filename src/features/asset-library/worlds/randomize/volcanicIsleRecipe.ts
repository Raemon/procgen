import type { NodeInstance } from '../pipeline/pipelineState';
import type { RandomStream } from '../random/mulberry32';
import { appendBandLayers, appendScatterLayers } from './terrainRecipe';
import { rollBetween, rollInt, snappedToStep } from './randomRolls';
import { nextRecipeId, recipeNode } from './recipeNode';

export function volcanicIsleRecipeNodes(
  rng: RandomStream,
  tileIds: readonly number[],
): NodeInstance[] {
  const nodes: NodeInstance[] = [];
  const conesId = appendHotspots(nodes, rng);
  const reliefId = appendConeField(nodes, rng, conesId);
  appendBandLayers(nodes, rng, tileIds, reliefId);
  appendScatterLayers(nodes, rng, tileIds, reliefId);
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

function appendConeField(nodes: NodeInstance[], rng: RandomStream, conesId: string): string {
  const id = nextRecipeId(nodes);
  nodes.push(
    recipeNode({
      id,
      type: 'volcanoConeField',
      label: 'isles',
      params: { seaLevel: snappedToStep(rollBetween(rng, 0.4, 0.5), 0, 1, 0.01) },
      inputs: { volcanoes: conesId },
      display: { mode: 'elevation', heightScale: snappedToStep(rollBetween(rng, 2, 6), 0.5, 8, 0.5) },
    }),
  );
  return id;
}

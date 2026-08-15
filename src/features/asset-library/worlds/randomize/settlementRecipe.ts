import type { NodeInstance } from '../pipeline/pipelineState';
import type { RandomStream } from '../random/mulberry32';
import { chance, rollBetween, rollInt, shuffled, snappedToStep } from './randomRolls';
import { nextRecipeId, recipeNode } from './recipeNode';
import { preferring, type RecipeTiles } from './recipeTiles';
import { riverlandsRecipeNodes } from './riverlandsRecipe';
import { terrainRecipeNodes } from './terrainRecipe';

export function settlementRecipeNodes(
  rng: RandomStream,
  tiles: RecipeTiles,
  cultureId: number,
): NodeInstance[] {
  const nodes = chance(rng, 0.4)
    ? riverlandsRecipeNodes(rng, tiles)
    : terrainRecipeNodes(rng, tiles);
  const groundId = firstFieldIdOf(nodes);
  if (groundId === null) return nodes;
  appendVillages(nodes, rng, tiles, groundId, cultureId);
  return nodes;
}

function firstFieldIdOf(nodes: readonly NodeInstance[]): string | null {
  const field = nodes.find((node) => node.type === 'terrainNoise' || node.type === 'noiseField');
  return field ? field.id : null;
}

function appendVillages(
  nodes: NodeInstance[],
  rng: RandomStream,
  tiles: RecipeTiles,
  groundId: string,
  cultureId: number,
): void {
  const layout = {
    radius: rollInt(rng, 24, 64),
    plotCells: rollInt(rng, 10, 20),
    streetWidth: rollInt(rng, 1, 5),
  };
  const buildAbove = snappedToStep(rollBetween(rng, 0.4, 0.55), 0, 1, 0.01);
  const centersId = appendVillageCenters(nodes, rng, groundId, buildAbove);
  appendStreets(nodes, rng, tiles, centersId, layout);
  appendPlots(nodes, centersId, groundId, layout, buildAbove, cultureId);
}

function appendVillageCenters(
  nodes: NodeInstance[],
  rng: RandomStream,
  groundId: string,
  buildAbove: number,
): string {
  const id = nextRecipeId(nodes);
  nodes.push(
    recipeNode({
      id,
      type: 'scatterPoints',
      label: 'village centers',
      params: {
        density: snappedToStep(rollBetween(rng, 0.0005, 0.002), 0, 1, 0.0005),
        maskAtLeast: buildAbove,
        maskAtMost: snappedToStep(buildAbove + rollBetween(rng, 0.15, 0.35), 0, 1, 0.01),
      },
      inputs: { mask: groundId },
    }),
  );
  return id;
}

interface VillageLayout {
  radius: number;
  plotCells: number;
  streetWidth: number;
}

function appendStreets(
  nodes: NodeInstance[],
  rng: RandomStream,
  tiles: RecipeTiles,
  centersId: string,
  layout: VillageLayout,
): void {
  const paving = shuffled(rng, preferring(tiles, 'walkable'));
  nodes.push(
    recipeNode({
      id: nextRecipeId(nodes),
      type: 'villageStreets',
      label: 'streets',
      params: {
        ...layout,
        streetTile: paving[0] ?? -1,
        plazaTile: paving[1 % Math.max(1, paving.length)] ?? -1,
      },
      inputs: { centers: centersId },
    }),
  );
}

function appendPlots(
  nodes: NodeInstance[],
  centersId: string,
  groundId: string,
  layout: VillageLayout,
  buildAbove: number,
  cultureId: number,
): void {
  nodes.push(
    recipeNode({
      id: nextRecipeId(nodes),
      type: 'villagePlots',
      label: 'plots',
      params: { ...layout, buildAbove },
      inputs: { centers: centersId, ground: groundId },
      display: { mode: 'structures', cultureId },
    }),
  );
}

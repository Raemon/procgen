import type { CultureId } from '@/features/asset-library/asset';
import { REGION_ROLE_FOCUS } from '../nodes/composition/regionPlanNode';
import { COMBINE_MULTIPLY } from '../nodes/examples/combineFields';
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
  cultureId: CultureId,
): NodeInstance[] {
  const nodes = chance(rng, 0.4)
    ? riverlandsRecipeNodes(rng, tiles)
    : terrainRecipeNodes(rng, tiles);
  const groundId = firstFieldIdOf(nodes);
  if (groundId === null) return nodes;
  appendVillages(nodes, rng, tiles, groundId, cultureId);
  appendKeep(nodes, rng, tiles);
  return nodes;
}

function appendKeep(nodes: NodeInstance[], rng: RandomStream, tiles: RecipeTiles): void {
  const wall = preferring(tiles, 'blockers')[0];
  if (wall === undefined) return;
  nodes.push(
    recipeNode({
      id: nextRecipeId(nodes),
      type: 'landmarkRoom',
      label: 'the keep',
      params: {
        x: rollInt(rng, -60, 60),
        y: rollInt(rng, -60, 60),
        width: rollInt(rng, 9, 13),
        height: rollInt(rng, 9, 13),
        wallThickness: 1,
        wallTile: wall,
      },
    }),
  );
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
  cultureId: CultureId,
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
  const settledId = appendSettledGround(nodes, rng, groundId);
  const id = nextRecipeId(nodes);
  nodes.push(
    recipeNode({
      id,
      type: 'scatterPoints',
      label: 'village centers',
      params: {
        density: snappedToStep(rollBetween(rng, 0.002, 0.006), 0, 1, 0.0005),
        maskAtLeast: snappedToStep(buildAbove * 0.55, 0, 1, 0.01),
        maskAtMost: 1,
      },
      inputs: { mask: settledId },
    }),
  );
  return id;
}

function appendSettledGround(
  nodes: NodeInstance[],
  rng: RandomStream,
  groundId: string,
): string {
  const focusId = nextRecipeId(nodes);
  nodes.push(
    recipeNode({
      id: focusId,
      type: 'regionPlan',
      label: 'heartlands',
      params: {
        pitch: rollInt(rng, 256, 512),
        focusShare: snappedToStep(rollBetween(rng, 0.1, 0.3), 0.05, 0.6, 0.05),
        falloff: snappedToStep(rollBetween(rng, 0.4, 0.7), 0.25, 1.2, 0.05),
        role: REGION_ROLE_FOCUS,
      },
    }),
  );
  const settledId = nextRecipeId(nodes);
  nodes.push(
    recipeNode({
      id: settledId,
      type: 'combineFields',
      label: 'settled ground',
      params: { operation: COMBINE_MULTIPLY, clamp: 1 },
      inputs: { a: groundId, b: focusId },
    }),
  );
  return settledId;
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
  cultureId: CultureId,
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

import { defaultBindingForKind } from '../display/displayBinding';
import { NOISE_STYLE_FBM, NOISE_STYLE_RIDGED } from '../noise/terrainOctaves';
import type { NodeInstance } from '../pipeline/pipelineState';
import type { RandomStream } from '../random/mulberry32';
import { chance, rollBetween, rollInt, snappedToStep } from './randomRolls';
import { nextRecipeId, recipeNode } from './recipeNode';
import { appendBandLayers, appendScatterLayers } from './terrainRecipe';

const MACRO_SCALE_LO = 0.006;
const MACRO_SCALE_HI = 0.016;
const RELIEF_HEIGHT_LO = 4;
const RELIEF_HEIGHT_HI = 7;

export function highlandsRecipeNodes(rng: RandomStream, tileIds: readonly number[]): NodeInstance[] {
  const nodes: NodeInstance[] = [];
  const rangesId = appendRanges(nodes, rng);
  const lowlandsId = appendLowlands(nodes, rng);
  const blendedId = appendReliefBlend(nodes, rng, rangesId, lowlandsId);
  const shelvedId = appendShelving(nodes, rng, blendedId);
  const reliefId = appendTerraces(nodes, rng, shelvedId);
  appendBandLayers(nodes, rng, tileIds, reliefId);
  appendScatterLayers(nodes, rng, tileIds, reliefId);
  return nodes;
}

function appendTerraces(nodes: NodeInstance[], rng: RandomStream, sourceId: string): string {
  const passesId = nextRecipeId(nodes);
  nodes.push(
    recipeNode({
      id: passesId,
      type: 'terrainNoise',
      label: 'pass corridors',
      params: {
        scale: snappedToStep(rollBetween(rng, 0.03, 0.08), 0.002, 0.2, 0.002),
        style: NOISE_STYLE_FBM,
        octaves: rollInt(rng, 2, 3),
      },
    }),
  );
  const terracedId = nextRecipeId(nodes);
  const levels = rollInt(rng, 3, 5);
  nodes.push(
    recipeNode({
      id: terracedId,
      type: 'terraceField',
      label: 'cliff terraces',
      params: {
        levels,
        passesAbove: snappedToStep(rollBetween(rng, 0.55, 0.7), 0, 1, 0.01),
      },
      inputs: { source: sourceId, passes: passesId },
    }),
  );
  moveReliefDisplayTo(nodes, sourceId, terracedId, levels);
  return terracedId;
}

function moveReliefDisplayTo(
  nodes: NodeInstance[],
  sourceId: string,
  terracedId: string,
  levels: number,
): void {
  const source = nodes.find((node) => node.id === sourceId);
  const terraced = nodes.find((node) => node.id === terracedId);
  if (!source || !terraced) return;
  const riserGates = 1.6 * levels;
  const heightScale = Math.min(8, Math.max(RELIEF_HEIGHT_LO, riserGates));
  terraced.display = { mode: 'elevation', heightScale };
  source.display = defaultBindingForKind('field');
}

function appendRanges(nodes: NodeInstance[], rng: RandomStream): string {
  const id = nextRecipeId(nodes);
  nodes.push(
    recipeNode({
      id,
      type: 'terrainNoise',
      label: 'mountain ranges',
      params: {
        scale: snappedToStep(rollBetween(rng, MACRO_SCALE_LO, MACRO_SCALE_HI), 0.002, 0.2, 0.002),
        style: NOISE_STYLE_RIDGED,
        octaves: rollInt(rng, 5, 8),
        gain: snappedToStep(rollBetween(rng, 0.42, 0.6), 0.2, 0.8, 0.01),
      },
    }),
  );
  return id;
}

function appendLowlands(nodes: NodeInstance[], rng: RandomStream): string {
  const id = nextRecipeId(nodes);
  nodes.push(
    recipeNode({
      id,
      type: 'terrainNoise',
      label: 'lowlands',
      params: {
        scale: snappedToStep(rollBetween(rng, 0.02, 0.06), 0.002, 0.2, 0.002),
        style: NOISE_STYLE_FBM,
        octaves: rollInt(rng, 3, 5),
      },
    }),
  );
  return id;
}

function appendReliefBlend(
  nodes: NodeInstance[],
  rng: RandomStream,
  rangesId: string,
  lowlandsId: string,
): string {
  const id = nextRecipeId(nodes);
  nodes.push(
    recipeNode({
      id,
      type: 'blendFields',
      label: 'relief',
      params: { weight: snappedToStep(rollBetween(rng, 0.15, 0.35), 0, 1, 0.01) },
      inputs: { a: rangesId, b: lowlandsId },
    }),
  );
  return id;
}

function appendShelving(nodes: NodeInstance[], rng: RandomStream, sourceId: string): string {
  if (!chance(rng, 0.7)) {
    displayAsRelief(nodes, rng, sourceId);
    return sourceId;
  }
  const id = nextRecipeId(nodes);
  nodes.push(
    recipeNode({
      id,
      type: 'hypsometricCurve',
      label: 'shelving',
      params: {
        seaLevel: snappedToStep(rollBetween(rng, 0.38, 0.5), 0.05, 0.95, 0.01),
        steepness: snappedToStep(rollBetween(rng, 6, 14), 1, 30, 0.5),
      },
      inputs: { source: sourceId },
    }),
  );
  displayAsRelief(nodes, rng, id);
  return id;
}

function displayAsRelief(nodes: NodeInstance[], rng: RandomStream, fieldId: string): void {
  const field = nodes.find((node) => node.id === fieldId);
  if (!field) return;
  field.display = {
    mode: 'elevation',
    heightScale: snappedToStep(rollBetween(rng, RELIEF_HEIGHT_LO, RELIEF_HEIGHT_HI), 0.5, 8, 0.5),
  };
}

import type { RandomStream } from '../random/mulberry32';
import {
  COMBINE_AVERAGE,
  COMBINE_MAX,
  COMBINE_MIN,
} from '../nodes/examples/combineFields';
import type { NodeInstance } from '../pipeline/pipelineState';
import { randomMarkerDisplay, randomMarkerTag } from './markerPalette';
import { chance, pick, rollBetween, rollInt, shuffled, snappedToStep } from './randomRolls';
import { nextRecipeId, recipeNode } from './recipeNode';

const BLEND_OPERATIONS = [COMBINE_AVERAGE, COMBINE_MIN, COMBINE_MAX] as const;

export function terrainRecipeNodes(rng: RandomStream, tileIds: readonly number[]): NodeInstance[] {
  const nodes: NodeInstance[] = [];
  const heightId = appendHeightField(nodes, rng);
  appendBandLayers(nodes, rng, tileIds, heightId);
  appendScatterLayers(nodes, rng, tileIds, heightId);
  return nodes;
}

function appendHeightField(nodes: NodeInstance[], rng: RandomStream): string {
  const baseId = appendNoise(nodes, rng, 'base noise');
  const heightId = chance(rng, 0.5)
    ? appendBlend(nodes, rng, baseId, appendNoise(nodes, rng, 'detail noise'))
    : baseId;
  applyElevationDisplay(nodes, rng, heightId);
  return heightId;
}

function appendNoise(nodes: NodeInstance[], rng: RandomStream, label: string): string {
  const id = nextRecipeId(nodes);
  nodes.push(
    recipeNode({
      id,
      type: 'noiseField',
      label,
      params: {
        scale: snappedToStep(rollBetween(rng, 0.015, 0.12), 0.005, 0.3, 0.005),
        octaves: rollInt(rng, 2, 6),
      },
    }),
  );
  return id;
}

function appendBlend(nodes: NodeInstance[], rng: RandomStream, aId: string, bId: string): string {
  const id = nextRecipeId(nodes);
  nodes.push(
    recipeNode({
      id,
      type: 'combineFields',
      label: 'blend',
      params: { operation: pick(rng, BLEND_OPERATIONS), clamp: 1 },
      inputs: { a: aId, b: bId },
    }),
  );
  return id;
}

function applyElevationDisplay(nodes: NodeInstance[], rng: RandomStream, fieldId: string): void {
  if (!chance(rng, 0.75)) return;
  const field = nodes.find((node) => node.id === fieldId);
  if (field) field.display = { mode: 'elevation', heightScale: snappedToStep(rollBetween(rng, 1, 5), 0.5, 8, 0.5) };
}

export function appendBandLayers(
  nodes: NodeInstance[],
  rng: RandomStream,
  tileIds: readonly number[],
  sourceId: string,
): void {
  const bandCount = rollInt(rng, 2, 4);
  const tiles = bandTiles(rng, tileIds, bandCount + 1);
  let threshold = rollBetween(rng, 0.32, 0.5);
  for (let band = 0; band < bandCount; band++) {
    appendBand(nodes, sourceId, band, snappedToStep(threshold, 0, 1, 0.01), tiles);
    threshold += rollBetween(rng, 0.07, 0.16);
  }
}

function appendBand(
  nodes: NodeInstance[],
  sourceId: string,
  band: number,
  threshold: number,
  tiles: readonly number[],
): void {
  nodes.push(
    recipeNode({
      id: nextRecipeId(nodes),
      type: 'thresholdTiles',
      label: `band ${band + 1}`,
      params: {
        threshold,
        belowTile: band === 0 ? tiles[0]! : -1,
        aboveTile: tiles[band + 1]!,
      },
      inputs: { source: sourceId },
    }),
  );
}

function bandTiles(rng: RandomStream, tileIds: readonly number[], count: number): number[] {
  if (tileIds.length === 0) return Array.from({ length: count }, () => -1);
  const pool = shuffled(rng, tileIds);
  return Array.from({ length: count }, (_, index) => pool[index % pool.length]!);
}

export function appendScatterLayers(
  nodes: NodeInstance[],
  rng: RandomStream,
  tileIds: readonly number[],
  maskId: string,
): void {
  const scatterCount = rollInt(rng, 0, 2);
  for (let i = 0; i < scatterCount; i++) appendScatter(nodes, rng, tileIds, maskId);
}

function appendScatter(
  nodes: NodeInstance[],
  rng: RandomStream,
  tileIds: readonly number[],
  maskId: string,
): void {
  const tag = randomMarkerTag(rng);
  const maskAtLeast = snappedToStep(rollBetween(rng, 0.3, 0.7), 0, 1, 0.01);
  nodes.push(
    recipeNode({
      id: nextRecipeId(nodes),
      type: 'scatterPoints',
      label: `${tag} scatter`,
      params: {
        density: snappedToStep(rollBetween(rng, 0.01, 0.09), 0, 1, 0.005),
        maskAtLeast,
        maskAtMost: snappedToStep(maskAtLeast + rollBetween(rng, 0.08, 0.3), 0, 1, 0.01),
      },
      inputs: { mask: maskId },
      display: randomMarkerDisplay(rng, tileIds),
    }),
  );
}

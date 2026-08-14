import { defaultBindingForKind } from '../display/displayBinding';
import { NOISE_STYLE_FBM, NOISE_STYLE_RIDGED } from '../noise/terrainOctaves';
import type { NodeInstance } from '../pipeline/pipelineState';
import type { RandomStream } from '../random/mulberry32';
import { randomMarkerDisplay, randomMarkerTag } from './markerPalette';
import { chance, rollBetween, rollInt, shuffled, snappedToStep } from './randomRolls';
import { nextRecipeId, recipeNode } from './recipeNode';

const CLIMATE_CUTS = [0, 0.5, 0.72];

export function biomePartitionRecipeNodes(
  rng: RandomStream,
  tileIds: readonly number[],
): NodeInstance[] {
  const nodes: NodeInstance[] = [];
  const smoothId = appendRelief(nodes, rng);
  const reliefId = chance(rng, 0.6) ? appendTerracedRelief(nodes, rng, smoothId) : smoothId;
  const climateId = appendClimate(nodes, rng);
  const biomes = biomePalettesOf(rng, tileIds);
  const seaLevel = snappedToStep(rollBetween(rng, 0.38, 0.48), 0, 1, 0.01);
  biomes.forEach((palette, at) =>
    appendBiome(nodes, rng, reliefId, climateId, palette, CLIMATE_CUTS[at]!, seaLevel),
  );
  appendBiomeScatter(nodes, rng, tileIds, climateId);
  return nodes;
}

function appendRelief(nodes: NodeInstance[], rng: RandomStream): string {
  const id = nextRecipeId(nodes);
  nodes.push(
    recipeNode({
      id,
      type: 'terrainNoise',
      label: 'relief',
      params: {
        scale: snappedToStep(rollBetween(rng, 0.006, 0.016), 0.002, 0.2, 0.002),
        style: chance(rng, 0.5) ? NOISE_STYLE_RIDGED : NOISE_STYLE_FBM,
        octaves: rollInt(rng, 4, 7),
      },
      display: {
        mode: 'elevation',
        heightScale: snappedToStep(rollBetween(rng, 3, 6.5), 0.5, 8, 0.5),
      },
    }),
  );
  return id;
}

function appendTerracedRelief(
  nodes: NodeInstance[],
  rng: RandomStream,
  smoothId: string,
): string {
  const passesId = nextRecipeId(nodes);
  nodes.push(
    recipeNode({
      id: passesId,
      type: 'terrainNoise',
      label: 'pass corridors',
      params: {
        scale: snappedToStep(rollBetween(rng, 0.03, 0.08), 0.002, 0.2, 0.002),
        style: NOISE_STYLE_FBM,
        octaves: 2,
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
      params: { levels, passesAbove: snappedToStep(rollBetween(rng, 0.55, 0.7), 0, 1, 0.01) },
      inputs: { source: smoothId, passes: passesId },
    }),
  );
  const smooth = nodes.find((node) => node.id === smoothId);
  const terraced = nodes.find((node) => node.id === terracedId);
  if (smooth && terraced) {
    terraced.display = { mode: 'elevation', heightScale: Math.min(8, 1.6 * levels) };
    smooth.display = defaultBindingForKind('field');
  }
  return terracedId;
}

function appendClimate(nodes: NodeInstance[], rng: RandomStream): string {
  const id = nextRecipeId(nodes);
  nodes.push(
    recipeNode({
      id,
      type: 'terrainNoise',
      label: 'climate',
      params: {
        scale: snappedToStep(rollBetween(rng, 0.004, 0.01), 0.002, 0.2, 0.002),
        style: NOISE_STYLE_FBM,
        octaves: rollInt(rng, 2, 3),
      },
    }),
  );
  return id;
}

interface BiomePalette {
  ground: number;
  rock: number;
  snow: number;
  shore: number;
  water: number;
  deep: number;
}

function biomePalettesOf(rng: RandomStream, tileIds: readonly number[]): BiomePalette[] {
  const pool = shuffled(rng, tileIds);
  if (pool.length === 0) {
    const empty = { ground: -1, rock: -1, snow: -1, shore: -1, water: -1, deep: -1 };
    return CLIMATE_CUTS.map(() => ({ ...empty }));
  }
  const water = pool[0]!;
  const deep = pool[1 % pool.length]!;
  const land = pool.length > 2 ? pool.slice(2) : pool;
  return CLIMATE_CUTS.map((_cut, biome) => ({
    ground: drawn(land, biome * 3),
    rock: drawn(land, biome * 3 + 1),
    snow: drawn(land, biome * 3 + 2),
    shore: drawn(land, biome * 3 + 1),
    water,
    deep,
  }));
}

function drawn(pool: readonly number[], at: number): number {
  return pool[at % pool.length]!;
}

function appendBiome(
  nodes: NodeInstance[],
  rng: RandomStream,
  reliefId: string,
  climateId: string,
  palette: BiomePalette,
  regionAtLeast: number,
  seaLevel: number,
): void {
  nodes.push(
    recipeNode({
      id: nextRecipeId(nodes),
      type: 'biomeBands',
      label: `biome ≥${regionAtLeast}`,
      params: {
        seaLevel,
        shoreBand: snappedToStep(rollBetween(rng, 0.02, 0.08), 0, 0.5, 0.01),
        snowLine: snappedToStep(rollBetween(rng, 0.7, 0.95), 0, 1, 0.01),
        regionAtLeast,
        deepTile: palette.deep,
        waterTile: palette.water,
        shoreTile: palette.shore,
        groundTile: palette.ground,
        rockTile: palette.rock,
        snowTile: palette.snow,
      },
      inputs: { elevation: reliefId, region: climateId },
    }),
  );
}

function appendBiomeScatter(
  nodes: NodeInstance[],
  rng: RandomStream,
  tileIds: readonly number[],
  climateId: string,
): void {
  const scatters = rollInt(rng, 1, 2);
  for (let each = 0; each < scatters; each++) {
    const cut = CLIMATE_CUTS[rollInt(rng, 0, CLIMATE_CUTS.length - 1)]!;
    nodes.push(
      recipeNode({
        id: nextRecipeId(nodes),
        type: 'scatterPoints',
        label: `${randomMarkerTag(rng)} scatter`,
        params: {
          density: snappedToStep(rollBetween(rng, 0.004, 0.02), 0, 1, 0.001),
          maskAtLeast: cut,
          maskAtMost: snappedToStep(cut + 0.3, 0, 1, 0.01),
        },
        inputs: { mask: climateId },
        display: randomMarkerDisplay(rng, tileIds),
      }),
    );
  }
}

import { defaultBindingForKind } from '../display/displayBinding';
import { nodeTypeOf } from '../nodeRegistry';
import { NOISE_STYLE_FBM } from '../noise/terrainOctaves';
import { nextNodeId } from '../pipeline/createNodeInstance';
import type { PipelineState } from '../pipeline/pipelineState';
import { sanitizePipeline } from '../pipeline/sanitizePipeline';
import type { RandomStream } from '../random/mulberry32';
import { clonedState } from '../randomize/clonedState';
import { randomMarkerDisplay, randomMarkerTag } from '../randomize/markerPalette';
import { chance, pick, rollBetween, rollInt, snappedToStep } from '../randomize/randomRolls';
import { recipeNode } from '../randomize/recipeNode';
import { readingBandOf } from '../walkingSim/readingBands';
import { funOf, type ScoredWorld } from './scoreGenome';
import { worldPaletteOfKit, type WorldPalette } from './worldPalette';
import type { WorldGenome } from './worldGenome';

const REMEDIABLE_BELOW = 0.35;
const OTHERWISE_HEALTHY_ABOVE = 0.45;

export interface Diagnosis {
  reading: string;
  ailment: 'starved' | 'flooded';
}

export function diagnosisOf(world: ScoredWorld): Diagnosis | null {
  const readings = world.score.readings.filter((each) => each.weight > 0);
  const weakest = readings.reduce((worst, each) => (each.score < worst.score ? each : worst));
  if (weakest.score >= REMEDIABLE_BELOW) return null;
  const others = readings.filter((each) => each !== weakest);
  const rest = others.reduce((sum, each) => sum + each.score * each.weight, 0) /
    others.reduce((sum, each) => sum + each.weight, 0);
  if (rest < OTHERWISE_HEALTHY_ABOVE) return null;
  const band = readingBandOf(weakest.name);
  if (!band) return null;
  return { reading: weakest.name, ailment: weakest.value < band.lo ? 'starved' : 'flooded' };
}

export function treatedGenome(
  world: ScoredWorld,
  diagnosis: Diagnosis,
  rng: RandomStream,
): WorldGenome {
  const genome = world.genome;
  const pipeline = clonedState(genome.pipeline);
  const palette = worldPaletteOfKit(genome.kitSeed, genome.accentKitSeed, genome.paletteSize);
  applyTreatment(pipeline, diagnosis, rng, palette);
  return { ...genome, pipeline: sanitizePipeline(pipeline) };
}

function applyTreatment(
  pipeline: PipelineState,
  diagnosis: Diagnosis,
  rng: RandomStream,
  palette: WorldPalette,
): void {
  const treatment = TREATMENTS[diagnosis.reading];
  if (treatment) {
    treatment(pipeline, diagnosis.ailment, rng, palette);
    return;
  }
  scaleScatterDensities(pipeline, diagnosis.ailment === 'starved' ? 2 : 0.5);
}

type Treatment = (
  pipeline: PipelineState,
  ailment: Diagnosis['ailment'],
  rng: RandomStream,
  palette: WorldPalette,
) => void;

const TREATMENTS: Record<string, Treatment> = {
  'encounters /100 steps': treatDiscoveries,
  'discovery kinds': treatDiscoveries,
  'conflicted choices /100': treatDiscoveries,
  'promises kept': treatPromises,
  'longest drought': treatDiscoveries,
  'elevation gates': treatElevationGates,
  'climb reveal ratio': treatElevationGates,
  'decision points /100': treatRouteStructure,
  'corridor loops /100 cells': treatRouteStructure,
  'retread share': treatRetread,
  'vista moments /100': treatEnclosure,
  'enclosed share': treatEnclosure,
  'scenery entropy (bits)': treatSceneryVariety,
  'view distinctness': treatSceneryVariety,
  'regional differentiation': treatSceneryVariety,
  'landmark pull': treatLandmarks,
};

function treatDiscoveries(
  pipeline: PipelineState,
  ailment: Diagnosis['ailment'],
  rng: RandomStream,
  palette: WorldPalette,
): void {
  if (ailment === 'flooded') {
    scaleScatterDensities(pipeline, 0.4);
    return;
  }
  if (scaleScatterDensities(pipeline, 2.2) === 0 || chance(rng, 0.4)) {
    appendScatterNode(pipeline, rng, palette);
  }
}

function treatPromises(
  pipeline: PipelineState,
  ailment: Diagnosis['ailment'],
  rng: RandomStream,
  palette: WorldPalette,
): void {
  if (ailment === 'starved') {
    scaleScatterDensities(pipeline, 0.5);
    appendBridgesOverWater(pipeline, rng, palette);
    return;
  }
  scaleScatterDensities(pipeline, 0.6);
}

function treatElevationGates(
  pipeline: PipelineState,
  ailment: Diagnosis['ailment'],
  rng: RandomStream,
  _palette: WorldPalette,
): void {
  const terraces = pipeline.nodes.filter((node) => node.type === 'terraceField');
  if (ailment === 'flooded') {
    for (const terrace of terraces) {
      terrace.params.passesAbove = snappedToStep(
        Number(terrace.params.passesAbove ?? 0.65) - 0.12,
        0,
        1,
        0.01,
      );
    }
    return;
  }
  if (terraces.length > 0) {
    for (const terrace of terraces) {
      terrace.params.levels = Math.min(12, Math.round(Number(terrace.params.levels ?? 4)) + 1);
    }
    return;
  }
  appendTerracesOverElevation(pipeline, rng);
}

function treatRouteStructure(
  pipeline: PipelineState,
  ailment: Diagnosis['ailment'],
  rng: RandomStream,
  palette: WorldPalette,
): void {
  if (ailment === 'flooded') {
    braidMazes(pipeline, -0.2);
    return;
  }
  if (braidMazes(pipeline, 0.25) > 0) return;
  if (chance(rng, 0.5)) appendTerracesOverElevation(pipeline, rng);
  else appendBridgesOverWater(pipeline, rng, palette);
}

function treatRetread(
  pipeline: PipelineState,
  _ailment: Diagnosis['ailment'],
  rng: RandomStream,
  palette: WorldPalette,
): void {
  if (braidMazes(pipeline, 0.3) > 0) return;
  appendBridgesOverWater(pipeline, rng, palette);
}

function treatEnclosure(
  pipeline: PipelineState,
  ailment: Diagnosis['ailment'],
  rng: RandomStream,
  palette: WorldPalette,
): void {
  if (ailment === 'flooded') {
    dropOneNodePainting(pipeline, blockerTileIdsOf(palette));
    return;
  }
  appendWoodsBand(pipeline, rng, palette);
}

function treatSceneryVariety(
  pipeline: PipelineState,
  _ailment: Diagnosis['ailment'],
  rng: RandomStream,
  palette: WorldPalette,
): void {
  appendWoodsBand(pipeline, rng, palette);
  scaleScatterDensities(pipeline, 1.4);
}

function treatLandmarks(
  pipeline: PipelineState,
  _ailment: Diagnosis['ailment'],
  rng: RandomStream,
  palette: WorldPalette,
): void {
  const blockers = blockerTileIdsOf(palette);
  if (blockers.length === 0) return;
  appendScatterNode(pipeline, rng, palette, {
    density: snappedToStep(rollBetween(rng, 0.0005, 0.002), 0, 1, 0.0005),
    tileId: pick(rng, blockers),
  });
}

function scaleScatterDensities(pipeline: PipelineState, factor: number): number {
  let touched = 0;
  for (const node of pipeline.nodes) {
    if (node.type !== 'scatterPoints') continue;
    const density = Number(node.params.density ?? 0);
    node.params.density = snappedToStep(
      Math.min(0.2, Math.max(0.0005, density * factor)),
      0,
      1,
      0.0005,
    );
    touched++;
  }
  return touched;
}

function braidMazes(pipeline: PipelineState, delta: number): number {
  let touched = 0;
  for (const node of pipeline.nodes) {
    if (node.type !== 'mazeChunk') continue;
    node.params.braid = snappedToStep(
      Math.min(1, Math.max(0, Number(node.params.braid ?? 0) + delta)),
      0,
      1,
      0.05,
    );
    touched++;
  }
  return touched;
}

function appendScatterNode(
  pipeline: PipelineState,
  rng: RandomStream,
  palette: WorldPalette,
  wanted?: { density?: number; tileId?: number },
): void {
  const maskId = lastFieldNodeIdOf(pipeline);
  pipeline.nodes.push(
    recipeNode({
      id: nextNodeId(pipeline),
      type: 'scatterPoints',
      label: `${randomMarkerTag(rng)} scatter`,
      params: {
        density: wanted?.density ?? snappedToStep(rollBetween(rng, 0.008, 0.03), 0, 1, 0.001),
        maskAtLeast: 0,
        maskAtMost: 1,
      },
      inputs: maskId ? { mask: maskId } : {},
      display:
        wanted?.tileId !== undefined
          ? { mode: 'markers', tileId: wanted.tileId, glyph: '▲', color: '#c2c2c2' }
          : randomMarkerDisplay(rng, palette.paletteIds),
    }),
  );
}

function appendWoodsBand(
  pipeline: PipelineState,
  rng: RandomStream,
  palette: WorldPalette,
): void {
  const blockers = blockerTileIdsOf(palette);
  const maskId = lastFieldNodeIdOf(pipeline);
  if (blockers.length === 0 || !maskId) return;
  const at = snappedToStep(rollBetween(rng, 0.5, 0.7), 0, 1, 0.01);
  pipeline.nodes.push(
    recipeNode({
      id: nextNodeId(pipeline),
      type: 'thresholdTiles',
      label: 'woods',
      params: { threshold: at, belowTile: -1, aboveTile: pick(rng, blockers) },
      inputs: { source: maskId },
    }),
  );
}

function appendTerracesOverElevation(pipeline: PipelineState, rng: RandomStream): void {
  const elevated = pipeline.nodes.filter((node) => node.display.mode === 'elevation');
  const source = elevated[elevated.length - 1];
  if (!source) return;
  const passesId = nextNodeId(pipeline);
  pipeline.nodes.push(
    recipeNode({
      id: passesId,
      type: 'terrainNoise',
      label: 'pass corridors',
      params: { scale: snappedToStep(rollBetween(rng, 0.03, 0.08), 0.002, 0.2, 0.002), style: NOISE_STYLE_FBM, octaves: 2 },
    }),
  );
  const levels = rollInt(rng, 3, 5);
  const terracedId = nextNodeId(pipeline);
  pipeline.nodes.push(
    recipeNode({
      id: terracedId,
      type: 'terraceField',
      label: 'cliff terraces',
      params: { levels, passesAbove: snappedToStep(rollBetween(rng, 0.55, 0.7), 0, 1, 0.01) },
      inputs: { source: source.id, passes: passesId },
    }),
  );
  const terraced = pipeline.nodes[pipeline.nodes.length - 1]!;
  terraced.display = { mode: 'elevation', heightScale: Math.min(8, 1.6 * levels) };
  source.display = defaultBindingForKind('field');
}

function appendBridgesOverWater(
  pipeline: PipelineState,
  rng: RandomStream,
  palette: WorldPalette,
): void {
  const waterId = lastFieldNodeIdOf(pipeline);
  const walkable = walkableTileIdsOf(palette);
  if (!waterId || walkable.length === 0) return;
  pipeline.nodes.push(
    recipeNode({
      id: nextNodeId(pipeline),
      type: 'straitBridges',
      label: 'bridges',
      params: {
        waterBelow: snappedToStep(rollBetween(rng, 0.38, 0.5), 0, 1, 0.01),
        shallowBand: snappedToStep(rollBetween(rng, 0.1, 0.25), 0.02, 0.5, 0.01),
        maxSpan: rollInt(rng, 6, 14),
        pitch: pick(rng, [20, 28, 36]),
        bridgeTile: pick(rng, walkable),
      },
      inputs: { water: waterId },
    }),
  );
}

function lastFieldNodeIdOf(pipeline: PipelineState): string | null {
  for (let at = pipeline.nodes.length - 1; at >= 0; at--) {
    const node = pipeline.nodes[at]!;
    const def = nodeTypeOf(node.type);
    if (def && def.output === 'field') return node.id;
  }
  return null;
}

function dropOneNodePainting(pipeline: PipelineState, blockers: readonly number[]): void {
  const painting = pipeline.nodes.findIndex(
    (node) =>
      node.type === 'thresholdTiles' &&
      blockers.includes(Number((node.params as Record<string, unknown>).aboveTile)),
  );
  if (painting >= 0 && pipeline.nodes.length > 1) pipeline.nodes.splice(painting, 1);
}

function blockerTileIdsOf(palette: WorldPalette): number[] {
  return palette.tiles.filter((tile) => !tile.walkable).map((tile) => tile.id)
    .filter((id) => palette.paletteIds.includes(id));
}

function walkableTileIdsOf(palette: WorldPalette): number[] {
  return palette.tiles.filter((tile) => tile.walkable).map((tile) => tile.id)
    .filter((id) => palette.paletteIds.includes(id));
}

export function worthTreating(world: ScoredWorld): boolean {
  return diagnosisOf(world) !== null && funOf(world) > 0.25;
}

import { describe, test } from 'node:test';
import assert from 'node:assert';
import '../procgen/nodes';
import { checkCharacterBillboardInvariants } from './checkCharacterBillboardInvariants';
import { checkItemAndInventoryInvariants } from './checkItemAndInventoryInvariants';
import { checkPlayerCharacterInvariants } from './checkPlayerCharacterInvariants';
import { checkLandmarkAndCeilingInvariants } from './checkLandmarkAndCeilingInvariants';
import { checkDelveDarknessInvariants } from './checkDelveDarknessInvariants';
import { checkPrefabAndCreatureInvariants } from './checkPrefabAndCreatureInvariants';
import { checkTileHeightInvariants } from './checkTileHeightInvariants';
import { checkPresentationFoldersAreTheOnlyDomCode } from './checkPresentationFoldersAreTheOnlyDomCode';
import { checkDesignBetsStillHold } from './checkDesignBetsStillHold';
import { checkPuzzleInvariants } from './checkPuzzleInvariants';
import { checkEveryApiSurfaceIsDescribed } from './checkEveryApiSurfaceIsDescribed';
import { checkClaudeMdPointsAtThingsThatExist } from './checkClaudeMdPointsAtThingsThatExist';
import { checkDocumentationHasNotRegrown } from './checkDocumentationHasNotRegrown';
import { checkPerformanceReadouts } from './checkPerformanceReadouts';
import { cameraRelativeStep } from '../world/input/cameraRelativeStep';
import { PipelineEvaluator } from '../procgen/eval/evaluator';
import { allNodeTypes } from '../procgen/nodeRegistry';
import { defaultParams, isKnobParamSpec, outputKindOf } from '../procgen/nodeType';
import { computeNodeSignatures } from '../procgen/pipeline/nodeSignatures';
import { emptyPipeline, type PipelineState } from '../procgen/pipeline/pipelineState';
import { PipelineStore } from '../procgen/pipeline/pipelineStore';
import { sanitizePipeline } from '../procgen/pipeline/sanitizePipeline';
import { examplePipelines } from '../procgen/presets/examplePipelines';
import { sanitizeWorldPresets } from '../procgen/presets/worldPreset';
import { builtInTemplates } from '../procgen/templates/builtInTemplates';
import { stampTemplateInto } from '../procgen/templates/stampTemplate';
import { templateFromNodes } from '../procgen/templates/templateFromNodes';
import { sanitizeTemplates } from '../procgen/templates/nodeTemplate';
import { nodeFolderRuns } from '../procgen/panel/nodeFolderRuns';
import { mulberry32 } from '../procgen/random/mulberry32';
import { permutedNodeCombination } from '../procgen/randomize/permuteNodeCombination';
import { permutedSliderParams } from '../procgen/randomize/permuteSliderParams';
import { RandomizeHistory } from '../procgen/randomize/randomizeHistory';
import { randomWorldPipeline } from '../procgen/randomize/randomWorldPipeline';
import { nodeTypeOf } from '../procgen/nodeRegistry';
import { CHUNK_SIZE } from '../procgen/chunk';
import { CARVER_CHOICES } from '../procgen/nodes/maze/mazeCarvers';
import { traceRiverDownhill } from '../procgen/nodes/rivers/traceRiverDownhill';
import { hashLatticePoint } from '../procgen/noise/hashLatticePoint';
import { EMPTY_TILE } from '../procgen/values/chunkValues';
import { asField, asPoints, asTiles } from '../procgen/values/valueAccess';
import { WorldSampler } from '../procgen/worldSampler';
import { asciiSnapshot } from '../world/render/ascii/asciiSnapshot';
import { PLAYER_GLYPH } from '../world/render/ascii/asciiCells';
import { PanOffset } from '../world/render/camera/panOffset';
import { ZoomScale } from '../world/render/camera/zoomScale';
import { WorldRenderers, type WorldRenderer } from '../frontend/worldRenderers';
import { worldPanForDrag } from '../world/render/view3d/dragToWorldPan';
import { streamingRadiusChunks } from '../world/render/view3d/streamingRadius';
import { markerPlacementsForRect } from '../world/render/view3d/markerPlacements';
import { tilePlacementsForRect } from '../world/render/view3d/tilePlacements';
import { floodFillFacePixels } from '../library/pixelArtEditor/ops/floodFillFacePixels';
import {
  copyFaceToAllSides,
  sideFacesMatch,
} from '../library/pixelArtEditor/ops/linkedSideFaces';
import { mirroredPixelIndices } from '../library/pixelArtEditor/ops/mirroredPixelIndices';
import { resizeCubeFaceArt } from '../library/pixelArtEditor/ops/resizeFaceArt';
import { shiftFacePixelsWithWrap } from '../library/pixelArtEditor/ops/shiftFacePixelsWithWrap';
import { upgradeStoredFaceArt } from '../library/tiles/legacyFaceArt';
import {
  isTransparentInk,
  opaqueInk,
  TRANSPARENT_INK,
  withTransparency,
} from '../library/tiles/inkColor';
import {
  blankCubeFaceArt,
  blankFacePixels,
  cloneCubeFaceArt,
  isCubeFaceArt,
  isEntirelyBlank,
  SIDE_FACES,
} from '../library/tiles/tileFaceArt';
import {
  faceArtWithFrameInserted,
  faceArtWithFrameRemoved,
  faceArtWithPixelsAt,
  facePixelsAt,
  frameCount,
  frameMsOf,
  isAnimated,
} from '../library/tiles/faceArtFrames';
import { FLAT_HEIGHT_INK, heightInk, heightOfInk } from '../library/tiles/faceArtHeight';
import { faceArtPlan } from '../library/tiles/faceArtFacePlan';
import { normalTextureFromHeights } from '../world/render/view3d/normalTextureFromHeights';
import { tileBoxGeometry } from '../world/render/view3d/tileBoxGeometry';
import { scrolledWaves, wavePainter } from '../library/tiles/art/painters/wavePainter';
import { defaultTiles } from '../library/tiles/defaultTiles';
import { Tileset } from '../library/tiles/tileset';
import { isWalkableTile } from '../world/tileWalkability';
import { World } from '../world/world';
import '../abilities/index';
import { abilitiesForMode, abilityFor } from '../abilities/abilityRegistry';
import { performAbility } from '../abilities/performAbility';
import { buildApiDocs, everyAbility } from '../api/docs/apiDocs';
import { checkOnlyTheAbilityLayerCanMutate } from './checkAbilityLayerIsTheOnlyMutator';
import { TemplateLibrary } from '../procgen/templates/templateLibrary';
import { WorldPresetLibrary } from '../procgen/presets/worldPresetLibrary';
import { CreatureLibrary } from '../library/creatures/creatureLibrary';
import { ItemLibrary } from '../library/items/itemLibrary';
import { NO_GROUND_ITEMS } from '../library/items/pickups/groundItems';
import { PuzzleWorld } from '../world/puzzles/puzzleWorld';
import { PrefabLibrary } from '../library/prefabs/prefabLibrary';
import { FAILURES } from '../agents/failures';
import { nodeTypesJson } from '../agents/nodeCatalog';
import { buildObservation, GOD_VIEW_SIZE, SELF_GLYPH } from '../agents/observation';
import { observationText } from '../agents/observationText';
import { facingRelativeStep } from '../world/input/facingRelativeStep';
import {
  facingVector,
  facingYawRadians,
  isInFrontHalfPlane,
  turnedFacing,
  type FacingIndex,
} from '../world/facing';
import { Vector3 } from 'three';
import {
  DEFAULT_CHARACTER_SIGHT_RADIUS_TILES,
  MAX_CHARACTER_SIGHT_RADIUS_TILES,
  MIN_CHARACTER_SIGHT_RADIUS_TILES,
  characterViewSize,
  clampSightRadiusTiles,
  hazeStartTiles,
  isWithinCharacterSight,
} from '../world/vision/characterSight';
import { CharacterCamera } from '../world/render/view3d/characterCamera';
import { createCharacterFog } from '../world/render/view3d/worldScene';

const CHARACTER_VIEW_SIZE_AT_DEFAULT_SIGHT = characterViewSize();


function firstPersonCamera(
  x = 0,
  y = 0,
  elevation = 0,
  facing: FacingIndex = 0,
): CharacterCamera {
  const camera = new CharacterCamera();
  camera.update(0, x, y, elevation, facingYawRadians(facing));
  return camera;
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
const tileset = new Tileset();

function check(name: string, condition: boolean): void {
  test(name, () => assert.ok(condition));
}

function worldFromState(state: PipelineState): {
  store: PipelineStore;
  evaluator: PipelineEvaluator;
  sampler: WorldSampler;
} {
  const store = new PipelineStore(state);
  const evaluator = new PipelineEvaluator(store);
  return { store, evaluator, sampler: new WorldSampler(store, evaluator, tileset) };
}

function islandsState(): PipelineState {
  return sanitizePipeline(examplePipelines()[0]!.state);
}

function fieldBytes(evaluator: PipelineEvaluator, nodeId: string, cx: number, cy: number): string {
  return JSON.stringify(Array.from(asField(evaluator.valueFor(nodeId, cx, cy)) ?? []));
}

function tileBytes(evaluator: PipelineEvaluator, nodeId: string, cx: number, cy: number): string {
  return JSON.stringify(Array.from(asTiles(evaluator.valueFor(nodeId, cx, cy)) ?? []));
}

function tileIdsInRegion(sampler: WorldSampler, span: number): Set<number> {
  const seen = new Set<number>();
  for (let y = -span; y < span; y++) {
    for (let x = -span; x < span; x++) seen.add(sampler.tileAt(x, y));
  }
  return seen;
}

check('node registry has example, maze, river and custom nodes', allNodeTypes().length >= 9);
check(
  'every node type except custom script is built only from numeric knobs and tile links',
  allNodeTypes().every(
    (def) => def.type === 'customScript' || Object.values(def.params).every(isKnobParamSpec),
  ),
);
check(
  'every choice knob stores numbers and explains every option',
  allNodeTypes().every((def) =>
    Object.values(def.params).every(
      (spec) =>
        spec.kind !== 'choice' ||
        spec.options.every(
          (option) =>
            typeof option.value === 'number' && option.label.length > 0 && option.help.length > 0,
        ),
    ),
  ),
);
check(
  'every node type explains what it does and when to use it',
  allNodeTypes().every((def) => def.description.length > 0 && def.whenToUse.length > 0),
);
check(
  'every param and input carries help text for its tooltip',
  allNodeTypes().every(
    (def) =>
      Object.values(def.params).every((spec) => spec.help.length > 0) &&
      Object.values(def.inputs).every((spec) => spec.help.length > 0),
  ),
);
check(
  'every select param explains each of its options',
  allNodeTypes().every((def) =>
    Object.values(def.params).every(
      (spec) => spec.kind !== 'select' || spec.options.every((option) => (spec.optionHelp[option] ?? '').length > 0),
    ),
  ),
);
check(
  'every example pipeline describes itself and comments every node',
  examplePipelines().every(
    (example) =>
      example.description.length > 0 &&
      sanitizePipeline(example.state).nodes.every((node) => node.comment.length > 0),
  ),
);
check(
  'every node type declares a resolvable output kind',
  allNodeTypes().every((def) =>
    ['field', 'tiles', 'points'].includes(outputKindOf(def, defaultParams(def))),
  ),
);

const islands = islandsState();
check('example pipeline survives sanitize with all nodes', islands.nodes.length === 5);

const a = worldFromState(islandsState());
const b = worldFromState(islandsState());
check(
  'same seed generates identical chunks across fresh evaluators',
  fieldBytes(a.evaluator, 'n1', 0, 0) === fieldBytes(b.evaluator, 'n1', 0, 0) &&
    tileBytes(a.evaluator, 'n2', -3, 2) === tileBytes(b.evaluator, 'n2', -3, 2),
);

const orderA = worldFromState(islandsState());
const orderB = worldFromState(islandsState());
const firstThenFar = [tileBytes(orderA.evaluator, 'n2', 0, 0), tileBytes(orderA.evaluator, 'n2', 5, 7)];
const farThenFirst = [tileBytes(orderB.evaluator, 'n2', 5, 7), tileBytes(orderB.evaluator, 'n2', 0, 0)];
check(
  'chunk evaluation order never changes results',
  firstThenFar[0] === farThenFirst[1] && firstThenFar[1] === farThenFirst[0],
);

const reseeded = worldFromState(islandsState());
reseeded.store.setSeed(999);
check(
  'different seeds generate different worlds',
  fieldBytes(reseeded.evaluator, 'n1', 0, 0) !== fieldBytes(a.evaluator, 'n1', 0, 0),
);

const beforeSigs = computeNodeSignatures(islandsState());
const tweaked = islandsState();
tweaked.nodes[0]!.params.scale = 0.11;
const afterSigs = computeNodeSignatures(tweaked);
check(
  'param change invalidates that node and downstream signatures',
  beforeSigs.get('n1') !== afterSigs.get('n1') && beforeSigs.get('n5') !== afterSigs.get('n5'),
);
const downstreamTweak = islandsState();
downstreamTweak.nodes[1]!.params.threshold = 0.6;
check(
  'downstream param change leaves upstream signature cached',
  computeNodeSignatures(downstreamTweak).get('n1') === beforeSigs.get('n1'),
);

const sampled = worldFromState(islandsState());
const seenTiles = tileIdsInRegion(sampled.sampler, 48);
check('tile layers stack: water, sand, grass and rock all appear', [0, 1, 2, 4].every((id) => seenTiles.has(id)));
check('elevation binding shapes the world', sampled.sampler.elevationAt(0, 0) !== 0 || sampled.sampler.elevationAt(17, -23) !== 0);
const treeMarkers = sampled.sampler.markersIn(-64, -64, 63, 63);
check(
  'scatter markers carry their node id as tag',
  treeMarkers.length > 0 && treeMarkers.every((m) => m.tag === 'n5'),
);
check(
  'tile-sourced markers take symbol and color from the tileset',
  treeMarkers.every((m) => m.glyph === '♠' && m.color === '#2d6a34'),
);

const treeId = tileset.idForRole('tree');
tileset.update(treeId, { symbol: 'T', color: '#123456' });
const editedTreeMarker = sampled.sampler.markersIn(-64, -64, 63, 63)[0]!;
check(
  'editing a tile restyles the markers that source it',
  editedTreeMarker.glyph === 'T' && editedTreeMarker.color === '#123456',
);
tileset.update(treeId, { symbol: '♠', color: '#2d6a34' });

sampled.store.setEnabled('n3', false);
check('disabling a node removes its tile layer', !tileIdsInRegion(sampled.sampler, 48).has(2));
sampled.store.setEnabled('n3', true);

const scatterPoints = asPoints(sampled.evaluator.valueFor('n5', 2, -1)) ?? [];
check(
  'scattered points stay inside their own chunk',
  scatterPoints.every(
    (p) =>
      p.x >= 2 * CHUNK_SIZE && p.x < 3 * CHUNK_SIZE && p.y >= -CHUNK_SIZE && p.y < 0,
  ),
);

const MAZE_FLOOR = 1;

function labyrinthVariant(params: Record<string, number>): PipelineState {
  const state = sanitizePipeline(examplePipelines()[3]!.state);
  Object.assign(state.nodes[0]!.params, params);
  return state;
}

function verticalSeamDoorRuns(sampler: WorldSampler, cx: number, cy: number): number {
  let runs = 0;
  let inRun = false;
  for (let y = cy * CHUNK_SIZE; y < (cy + 1) * CHUNK_SIZE; y++) {
    const open =
      sampler.tileAt((cx + 1) * CHUNK_SIZE - 1, y) === MAZE_FLOOR &&
      sampler.tileAt((cx + 1) * CHUNK_SIZE, y) === MAZE_FLOOR;
    if (open && !inRun) runs++;
    inRun = open;
  }
  return runs;
}

function horizontalSeamDoorRuns(sampler: WorldSampler, cx: number, cy: number): number {
  let runs = 0;
  let inRun = false;
  for (let x = cx * CHUNK_SIZE; x < (cx + 1) * CHUNK_SIZE; x++) {
    const open =
      sampler.tileAt(x, (cy + 1) * CHUNK_SIZE - 1) === MAZE_FLOOR &&
      sampler.tileAt(x, (cy + 1) * CHUNK_SIZE) === MAZE_FLOOR;
    if (open && !inRun) runs++;
    inRun = open;
  }
  return runs;
}

function allSeamsCrossable(sampler: WorldSampler, chunkSpan: number): boolean {
  for (let cy = -chunkSpan; cy < chunkSpan; cy++) {
    for (let cx = -chunkSpan; cx < chunkSpan; cx++) {
      if (cx + 1 < chunkSpan && verticalSeamDoorRuns(sampler, cx, cy) === 0) return false;
      if (cy + 1 < chunkSpan && horizontalSeamDoorRuns(sampler, cx, cy) === 0) return false;
    }
  }
  return true;
}

function regionFloorsConnected(sampler: WorldSampler, minX: number, minY: number, size: number): boolean {
  const isFloor = (i: number) =>
    sampler.tileAt(minX + (i % size), minY + Math.floor(i / size)) === MAZE_FLOOR;
  const floors = Array.from({ length: size * size }, (_, i) => i).filter(isFloor);
  if (floors.length === 0) return false;
  return floodedFloorCount(floors, size) === floors.length;
}

function floodedFloorCount(floors: number[], size: number): number {
  const floorSet = new Set(floors);
  const seen = new Set([floors[0]!]);
  const queue = [floors[0]!];
  while (queue.length > 0) {
    const i = queue.pop()!;
    for (const next of gridNeighbors(i, size)) {
      if (floorSet.has(next) && !seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return seen.size;
}

function gridNeighbors(i: number, size: number): number[] {
  const x = i % size;
  const y = Math.floor(i / size);
  const found: number[] = [];
  if (x > 0) found.push(i - 1);
  if (x < size - 1) found.push(i + 1);
  if (y > 0) found.push(i - size);
  if (y < size - 1) found.push(i + size);
  return found;
}

const mazeA = worldFromState(labyrinthVariant({}));
const mazeB = worldFromState(labyrinthVariant({}));
const mazeSeq = [tileBytes(mazeA.evaluator, 'n1', 0, 0), tileBytes(mazeA.evaluator, 'n1', 3, -2)];
const mazeRev = [tileBytes(mazeB.evaluator, 'n1', 3, -2), tileBytes(mazeB.evaluator, 'n1', 0, 0)];
check(
  'labyrinth chunks are deterministic regardless of evaluation order',
  mazeSeq[0] === mazeRev[1] && mazeSeq[1] === mazeRev[0],
);

const MAZE_SHAPES = [
  { corridor: 1, wall: 1 },
  { corridor: 2, wall: 2 },
  { corridor: 3, wall: 1 },
  { corridor: 5, wall: 2 },
  { corridor: 6, wall: 2 },
  { corridor: 7, wall: 1 },
];
for (const shape of MAZE_SHAPES) {
  for (const carver of CARVER_CHOICES) {
    const combo = worldFromState(labyrinthVariant({ ...shape, carver: carver.value }));
    check(
      `labyrinth corridor ${shape.corridor} wall ${shape.wall} + ${carver.label} stays connected across all chunks and seams`,
      allSeamsCrossable(combo.sampler, 2) && regionFloorsConnected(combo.sampler, -CHUNK_SIZE, -CHUNK_SIZE, 3 * CHUNK_SIZE),
    );
  }
}

const denseDoors = worldFromState(labyrinthVariant({ doorsPerEdge: 4 }));
check(
  'doors per edge adds extra seam crossings',
  verticalSeamDoorRuns(denseDoors.sampler, 0, 0) >= 2 && horizontalSeamDoorRuns(denseDoors.sampler, 0, 0) >= 2,
);

check(
  'corridor width knob reshapes the labyrinth',
  tileBytes(worldFromState(labyrinthVariant({ corridor: 7 })).evaluator, 'n1', 0, 0) !==
    tileBytes(mazeA.evaluator, 'n1', 0, 0),
);

const bigMazeA = worldFromState(labyrinthVariant({ mazeChunks: 2, corridor: 5, wall: 3 }));
const bigMazeB = worldFromState(labyrinthVariant({ mazeChunks: 2, corridor: 5, wall: 3 }));
const bigSeq = [tileBytes(bigMazeA.evaluator, 'n1', 0, 0), tileBytes(bigMazeA.evaluator, 'n1', 1, 1)];
const bigRev = [tileBytes(bigMazeB.evaluator, 'n1', 1, 1), tileBytes(bigMazeB.evaluator, 'n1', 0, 0)];
check(
  'chunks of one multi-chunk maze agree regardless of which is generated first',
  bigSeq[0] === bigRev[1] && bigSeq[1] === bigRev[0],
);
check(
  'a maze spanning multiple chunks stays one connected labyrinth across regions',
  regionFloorsConnected(bigMazeA.sampler, -2 * CHUNK_SIZE, -2 * CHUNK_SIZE, 4 * CHUNK_SIZE),
);

const nested = worldFromState(sanitizePipeline(examplePipelines()[4]!.state));
const nestedTiles = tileIdsInRegion(nested.sampler, 128);
check(
  'nested labyrinths preset shows the inner hedge maze through the outer maze corridors',
  [2, 3, 4].every((id) => nestedTiles.has(id)),
);

const rampElevation = (x: number): number => Math.max(0, Math.min(1, 0.9 - 0.005 * (x + 40)));
const rampHash = (x: number, y: number): number => hashLatticePoint(x, y, 7);
const straightRiver = traceRiverDownhill(
  (x) => rampElevation(x),
  rampHash,
  { seaLevel: 0.4, maxLength: 300, meander: 0 },
  0,
  0,
);
check(
  'a river on a slope flows straight downhill and stops at the sea',
  straightRiver.length === 61 &&
    straightRiver.every((cell, i) => cell.x === i && cell.y === 0),
);
const meanderingRiver = traceRiverDownhill(
  (x) => rampElevation(x),
  rampHash,
  { seaLevel: 0.4, maxLength: 300, meander: 0.05 },
  0,
  0,
);
check(
  'meander makes rivers wander but never uphill',
  meanderingRiver.some((cell) => cell.y !== 0) &&
    meanderingRiver.every(
      (cell, i) => i === 0 || rampElevation(cell.x) <= rampElevation(meanderingRiver[i - 1]!.x),
    ),
);

function riversExampleState(): PipelineState {
  return sanitizePipeline(examplePipelines()[5]!.state);
}

function riverCellAt(evaluator: PipelineEvaluator, worldX: number, worldY: number): boolean {
  const cx = Math.floor(worldX / CHUNK_SIZE);
  const cy = Math.floor(worldY / CHUNK_SIZE);
  const tiles = asTiles(evaluator.valueFor('n3', cx, cy));
  if (!tiles) return false;
  return tiles[(worldY - cy * CHUNK_SIZE) * CHUNK_SIZE + (worldX - cx * CHUNK_SIZE)] !== EMPTY_TILE;
}

function terrainAt(evaluator: PipelineEvaluator, worldX: number, worldY: number): number {
  const cx = Math.floor(worldX / CHUNK_SIZE);
  const cy = Math.floor(worldY / CHUNK_SIZE);
  const field = asField(evaluator.valueFor('n1', cx, cy));
  return field ? field[(worldY - cy * CHUNK_SIZE) * CHUNK_SIZE + (worldX - cx * CHUNK_SIZE)]! : 0;
}

const riversA = worldFromState(riversExampleState());
const riversB = worldFromState(riversExampleState());
const riverSeq = [tileBytes(riversA.evaluator, 'n3', 0, 0), tileBytes(riversA.evaluator, 'n3', 2, -2)];
const riverRev = [tileBytes(riversB.evaluator, 'n3', 2, -2), tileBytes(riversB.evaluator, 'n3', 0, 0)];
check(
  'river chunks are deterministic regardless of evaluation order',
  riverSeq[0] === riverRev[1] && riverSeq[1] === riverRev[0],
);

const riverCells: Array<[number, number]> = [];
for (let y = -64; y < 64; y++) {
  for (let x = -64; x < 64; x++) {
    if (riverCellAt(riversA.evaluator, x, y)) riverCells.push([x, y]);
  }
}
const flowsSomewhere = (x: number, y: number): boolean =>
  [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ].some(
    ([dx, dy]) =>
      riverCellAt(riversA.evaluator, x + dx!, y + dy!) ||
      terrainAt(riversA.evaluator, x + dx!, y + dy!) < 0.45,
  );
check('rivers appear in the rivers & towns preset', riverCells.length > 0);
check(
  'every river cell continues into another river cell or the sea',
  riverCells.every(([x, y]) => flowsSomewhere(x, y)),
);

const towns = riversA.sampler.markersIn(-96, -96, 95, 95);
check(
  'towns appear and are tagged as towns',
  towns.length > 0 && towns.every((m) => m.tag === 'town' && m.glyph === '⌂'),
);
check(
  'every town sits on a river',
  towns.every((m) => riverCellAt(riversA.evaluator, m.x, m.y)),
);
check(
  'every town qualifies as a river mouth or river junction',
  towns.every(
    (m) =>
      [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ].filter(([dx, dy]) => riverCellAt(riversA.evaluator, m.x + dx!, m.y + dy!)).length >= 3 ||
      [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ].some(([dx, dy]) => terrainAt(riversA.evaluator, m.x + dx!, m.y + dy!) < 0.45),
  ),
);
check(
  'towns keep their configured spacing from each other',
  towns.every((a, i) =>
    towns.every(
      (b, j) => i === j || (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y) > 14 * 14,
    ),
  ),
);

const scriptState = sanitizePipeline(examplePipelines()[2]!.state);
const scripted = worldFromState(scriptState);
const scriptedAgain = worldFromState(sanitizePipeline(examplePipelines()[2]!.state));
check(
  'custom script node runs deterministically',
  tileBytes(scripted.evaluator, 'n2', 1, 1) === tileBytes(scriptedAgain.evaluator, 'n2', 1, 1) &&
    tileIdsInRegion(scripted.sampler, 32).size > 1,
);
check('custom script node reports no error on valid code', scripted.evaluator.errorFor('n2') === null);

const badScript = sanitizePipeline(examplePipelines()[2]!.state);
badScript.nodes[1]!.params.code = 'return 5;';
const broken = worldFromState(badScript);
broken.evaluator.valueFor('n2', 0, 0);
check('broken script surfaces an error and yields an empty layer', broken.evaluator.errorFor('n2') !== null);

const roundtrip = sanitizePipeline(JSON.parse(JSON.stringify(islandsState())));
check('pipeline serialization roundtrips', JSON.stringify(roundtrip) === JSON.stringify(islandsState()));
check(
  'node comments survive sanitize and serialization',
  roundtrip.nodes.every((node, i) => node.comment === islandsState().nodes[i]!.comment),
);

const withUnknown = sanitizePipeline({
  seed: 1,
  nodes: [...(islandsState().nodes as unknown[]), { id: 'nx', type: 'doesNotExist', params: {} }],
});
check('unknown node types are dropped on load', withUnknown.nodes.length === 5);

const forwardWire = sanitizePipeline({
  seed: 1,
  nodes: [
    { id: 'n1', type: 'thresholdTiles', params: {}, inputs: { source: 'n2' } },
    { id: 'n2', type: 'noiseField', params: {}, inputs: {} },
  ],
});
check('wires to later nodes are dropped', forwardWire.nodes[0]!.inputs.source === null);

const editing = new PipelineStore(emptyPipeline());
const noiseA = editing.addNode('noiseField')!;
const noiseB = editing.addNode('noiseField')!;
const thresholdNode = editing.addNode('thresholdTiles')!;
check('a new node auto-wires to the nearest compatible source', thresholdNode.inputs.source === noiseB.id);
const combineNode = editing.addNode('combineFields')!;
check(
  'a new multi-input node fans out across the most recent distinct sources',
  combineNode.inputs.a === noiseB.id && combineNode.inputs.b === noiseA.id,
);
check('optional inputs stay unwired on creation', editing.addNode('scatterPoints')!.inputs.mask === null);

const duplicated = editing.duplicateNode(thresholdNode.id)!;
check(
  'duplicating copies params and wiring under a fresh id right after the original',
  duplicated.id !== thresholdNode.id &&
    duplicated.inputs.source === noiseB.id &&
    JSON.stringify(duplicated.params) === JSON.stringify(thresholdNode.params) &&
    editing.nodes()[3]!.id === duplicated.id,
);

editing.moveNodeToIndex(noiseB.id, editing.nodes().length);
check('dragging a node to the end lands it there', editing.nodes()[editing.nodes().length - 1]!.id === noiseB.id);
check(
  'dragging a source below its consumers unwires them but spares other wires',
  thresholdNode.inputs.source === null && combineNode.inputs.a === null && combineNode.inputs.b === noiseA.id,
);
editing.moveNodeToIndex(noiseB.id, 0);
check('dragging a node to the top lands it there', editing.nodes()[0]!.id === noiseB.id);

const healing = new PipelineStore(emptyPipeline());
const baseNoise = healing.addNode('noiseField')!;
const midCombine = healing.addNode('combineFields')!;
const tailCombine = healing.addNode('combineFields')!;
check(
  'with one source available every required input reuses it',
  midCombine.inputs.a === baseNoise.id && midCombine.inputs.b === baseNoise.id,
);
healing.removeNode(midCombine.id);
check(
  'deleting a mid-chain node splices its consumers onto its own source',
  tailCombine.inputs.a === baseNoise.id && tailCombine.inputs.b === baseNoise.id,
);
healing.removeNode(baseNoise.id);
check('deleting a node with no upstream leaves consumers unwired', tailCombine.inputs.a === null);

check('empty void is walkable', isWalkableTile(tileset, EMPTY_TILE));
check('water is not walkable', !isWalkableTile(tileset, 0));

const caves = worldFromState(sanitizePipeline(examplePipelines()[1]!.state));
const monsterMarkers = caves.sampler.markersIn(-64, -64, 63, 63);
check(
  'custom markers keep their own glyph and color',
  monsterMarkers.length > 0 && monsterMarkers.every((m) => m.glyph === 'M' && m.color === '#ff4444'),
);
const world = new World((x, y) => isWalkableTile(tileset, caves.sampler.tileAt(x, y)));
world.ensurePlayerOnWalkableGround();
check(
  'player stands on walkable ground after a world change',
  isWalkableTile(tileset, caves.sampler.tileAt(world.playerX, world.playerY)),
);
const blockedWorld = new World(() => false);
check('a refused step leaves the player in place', !blockedWorld.tryStep(1, 0) && blockedWorld.playerX === 0);

const snapshot = asciiSnapshot(caves.sampler, tileset, world.playerX, world.playerY, 31, 21);
const snapshotRows = snapshot.split('\n');
check('ascii snapshot has the requested dimensions', snapshotRows.length === 21 && snapshotRows[0]!.length === 31);
check('ascii snapshot marks the player once', snapshot.split(PLAYER_GLYPH).length === 2);

const emptyWorld = worldFromState(emptyPipeline());
check('a blank pipeline renders an empty world', emptyWorld.sampler.tileAt(3, 4) === EMPTY_TILE);

const art = blankCubeFaceArt();
check('blank face art validates and counts as blank', isCubeFaceArt(art) && isEntirelyBlank(art));
art.top[0] = '#ff0000';
check('painting a pixel makes face art non-blank', !isEntirelyBlank(art));
check('cloned face art does not share pixel arrays', cloneCubeFaceArt(art).top !== art.top);
check('malformed face art is rejected', !isCubeFaceArt({ top: [], sides: [], bottom: [] }));

const legacySides = blankFacePixels(8);
legacySides[1] = '#00ff00';
const upgraded = upgradeStoredFaceArt({
  top: blankFacePixels(8),
  sides: legacySides,
  bottom: blankFacePixels(8),
});
check('legacy top/sides/bottom art upgrades to six faces', isCubeFaceArt(upgraded) && upgraded!.size === 8);
check(
  'legacy sides spread to all four compass faces',
  SIDE_FACES.every((face) => upgraded![face][1] === '#00ff00'),
);
check('garbage stored art is dropped', upgradeStoredFaceArt({ top: [] }) === null);

const grown = resizeCubeFaceArt(art, 16);
check(
  'resizing up rescales painted pixels',
  grown.size === 16 && grown.top[0] === '#ff0000' && grown.top[1] === '#ff0000' && grown.top[16] === '#ff0000' && grown.top[2] === null,
);
check('resizing back down keeps the art', resizeCubeFaceArt(grown, 8).top[0] === '#ff0000');

const edgePixels = blankFacePixels(4);
edgePixels[3] = '#0000ff';
check('shifting wraps pixels around the edge', shiftFacePixelsWithWrap(edgePixels, 4, 1, 0)[0] === '#0000ff');
check('shifting down moves rows', shiftFacePixelsWithWrap(edgePixels, 4, 0, 1)[7] === '#0000ff');

const walledFace = blankFacePixels(4);
for (let col = 0; col < 4; col++) walledFace[4 + col] = '#ffffff';
const filled = floodFillFacePixels(walledFace, 4, 0, '#00ff00');
check(
  'flood fill stops at other colors',
  filled.slice(0, 4).every((p) => p === '#00ff00') && filled.slice(8).every((p) => p === null),
);

check(
  'mirrored painting hits both columns',
  String([...mirroredPixelIndices(0, 8, true, false)].sort((a, b) => a - b)) === '0,7',
);
check(
  'double mirror paints four corners',
  mirroredPixelIndices(0, 8, true, true).length === 4,
);

const splitSides = blankCubeFaceArt();
check('blank art has matching sides', sideFacesMatch(splitSides));
splitSides.north[0] = '#ff0000';
check('painting one side unmatches the sides', !sideFacesMatch(splitSides));
const relinked = copyFaceToAllSides(splitSides, 'north');
check('relinking copies one side everywhere', sideFacesMatch(relinked) && relinked.west[0] === '#ff0000');

const grass = tileset.byRole('grass')!;
const shippedGrassArt = grass.faceArt;
tileset.update(grass.id, { faceArt: art });
const placements = tilePlacementsForRect(sampled.sampler, tileset, -48, -48, 96, 96);
check('placements carry the tile face art', placements.floors.some((p) => p.faceArt === art));
tileset.update(grass.id, { faceArt: null });
const strippedPlacements = tilePlacementsForRect(sampled.sampler, tileset, -48, -48, 96, 96);
check(
  'tiles without art stay flat-colored',
  strippedPlacements.floors.some((p) => p.faceArt === null),
);
tileset.update(grass.id, { faceArt: shippedGrassArt });

tileset.update(treeId, { faceArt: art });
const markerPlacements = markerPlacementsForRect(sampled.sampler, -48, -48, 96, 96).pins;
check(
  'marker placements carry the sourced tile face art',
  markerPlacements.length > 0 && markerPlacements.every((p) => p.faceArt === art),
);
tileset.update(treeId, { faceArt: defaultTiles()[treeId]?.faceArt ?? null });

const stillArt = blankCubeFaceArt(4);
const twoFrames = faceArtWithFrameInserted(stillArt, 0);
check('adding a frame leaves the first one alone and starts a loop', frameCount(twoFrames) === 2);
const paintedSecondFrame = faceArtWithPixelsAt(
  twoFrames,
  { face: 'top', frame: 1, layer: 'color' },
  blankFacePixels(4).map((_, index) => (index === 0 ? '#ff0000' : null)),
);
check(
  'painting a later frame does not disturb the first',
  facePixelsAt(paintedSecondFrame, { face: 'top', frame: 1, layer: 'color' })[0] === '#ff0000' &&
    facePixelsAt(paintedSecondFrame, { face: 'top', frame: 0, layer: 'color' })[0] === null,
);
check(
  'a face a later frame leaves out is read from the first frame',
  facePixelsAt(paintedSecondFrame, { face: 'north', frame: 1, layer: 'color' }) ===
    facePixelsAt(paintedSecondFrame, { face: 'north', frame: 0, layer: 'color' }),
);
check(
  'animated art validates and survives a clone',
  isCubeFaceArt(paintedSecondFrame) &&
    frameCount(cloneCubeFaceArt(paintedSecondFrame)) === 2 &&
    isCubeFaceArt(JSON.parse(JSON.stringify(paintedSecondFrame))),
);
check(
  'dropping the first frame promotes the next one whole',
  facePixelsAt(faceArtWithFrameRemoved(paintedSecondFrame, 0), {
    face: 'north',
    frame: 0,
    layer: 'color',
  }).length === 16,
);
check('the last frame cannot be removed', frameCount(faceArtWithFrameRemoved(stillArt, 0)) === 1);
check('malformed frames are rejected', !isCubeFaceArt({ ...stillArt, framesAfterFirst: [{ color: { top: [] } }] }));

const reliefArt = faceArtWithPixelsAt(
  blankCubeFaceArt(4),
  { face: 'top', frame: 0, layer: 'height' },
  blankFacePixels(4).map((_, index) => (index === 0 ? heightInk(1) : null)),
);
check('a relief layer rides alongside the colours', isCubeFaceArt(reliefArt) && isEntirelyBlank(reliefArt) === false);
check(
  'unpainted relief pixels read as the same flat height as the flat ink',
  heightOfInk(FLAT_HEIGHT_INK) === heightOfInk(null) && heightOfInk(heightInk(1)) === 1,
);
check(
  'resizing carries the relief layer and every frame with it',
  facePixelsAt(resizeCubeFaceArt(reliefArt, 8), { face: 'top', frame: 0, layer: 'height' })[0] ===
    heightInk(1) &&
    frameCount(resizeCubeFaceArt(paintedSecondFrame, 8)) === 2,
);
check(
  'a difference painted on a later frame unmatches the sides',
  !sideFacesMatch(
    faceArtWithPixelsAt(faceArtWithFrameInserted(blankCubeFaceArt(4), 0), { face: 'north', frame: 1, layer: 'color' }, blankFacePixels(4).map(() => '#ff0000')),
  ),
);

const RAISED_PIXEL = 5;
const bumpyNormalBytes = normalTextureFromHeights(
  blankFacePixels(4).map((_, index) => (index === RAISED_PIXEL ? heightInk(1) : FLAT_HEIGHT_INK)),
).image.data as Uint8Array;
check(
  'a raised pixel tilts the normals of its neighbours away from straight up',
  bumpyNormalBytes[(RAISED_PIXEL - 1) * 4] !== 128 && bumpyNormalBytes[RAISED_PIXEL * 4] === 128,
);
check(
  'flat relief leaves every normal pointing straight up',
  [...(normalTextureFromHeights(blankFacePixels(4)).image.data as Uint8Array)].every(
    (channel, index) => (index % 4 === 2 || index % 4 === 3 ? channel === 255 : channel === 128),
  ),
);

const slabUvs = tileBoxGeometry(1, 0.1, 1).attributes.uv!;
const slabSideV = [...Array(4).keys()].map((corner) => slabUvs.getY(corner));
check(
  'a thin slab shows a thin band of its side art rather than the whole face squashed',
  Math.abs(Math.max(...slabSideV) - Math.min(...slabSideV) - 0.1) < 1e-6 &&
    Math.abs(Math.max(...slabSideV) - 1) < 1e-6,
);
const cubeUvs = tileBoxGeometry(1, 1, 1).attributes.uv!;
check(
  'a full cube still shows every face whole',
  [...Array(cubeUvs.count).keys()].every((vertex) =>
    [cubeUvs.getX(vertex), cubeUvs.getY(vertex)].every((coordinate) => coordinate === 0 || coordinate === 1),
  ),
);

const shallowWaves = { palette: ['#1', '#2', '#3', '#4'], wavelength: 16, amplitude: 2.2, bandHeight: 4, size: 32 };
const wavesAt = (phase: number) => wavePainter(scrolledWaves(shallowWaves, phase));
const everyWaterPixel = [...Array(32 * 32).keys()].map((index) => [index % 32, Math.floor(index / 32)] as const);
check(
  'each wave frame tiles seamlessly in both directions',
  everyWaterPixel.every(
    ([x, y]) => wavesAt(0)(x + 32, y) === wavesAt(0)(x, y) && wavesAt(0)(x, y + 32) === wavesAt(0)(x, y),
  ),
);
check(
  'the wave loop closes: scrolling a whole band lands back on the first frame',
  everyWaterPixel.every(([x, y]) => wavesAt(shallowWaves.bandHeight)(x, y) === wavesAt(0)(x, y)),
);
check(
  'no two frames of the swell are the same picture',
  new Set([0, 1, 2, 3].map((phase) => everyWaterPixel.map(([x, y]) => wavesAt(phase)(x, y)).join())).size === 4,
);

const shippedWater = defaultTiles().find((tile) => tile.role === 'water')!.faceArt!;
check(
  'the shipped water rolls through several frames',
  isAnimated(shippedWater) && frameCount(shippedWater) === 4 && frameMsOf(shippedWater) === 200,
);
check(
  'only the water surface moves — later frames carry nothing but the top face',
  (shippedWater.framesAfterFirst ?? []).every((frame) => Object.keys(frame.color).join() === 'top'),
);
check(
  'the water surface is drawn frame by frame while its still sides are drawn once',
  faceArtPlan(shippedWater, 'top').frames.length === 4 &&
    faceArtPlan(shippedWater, 'north').frames.length === 1,
);
check(
  'only the face carrying relief pays for a normal map',
  faceArtPlan(shippedWater, 'top').embossed && !faceArtPlan(shippedWater, 'north').embossed,
);
check(
  'the water surface carries a relief layer for the light to catch',
  facePixelsAt(shippedWater, { face: 'top', frame: 0, layer: 'height' }).some(
    (pixel) => pixel !== null && heightOfInk(pixel) !== 0.5,
  ),
);

const shippedTiles = defaultTiles();
check(
  'every shipped tile carries 32px cube art',
  shippedTiles.every((tile) => isCubeFaceArt(tile.faceArt) && tile.faceArt.size === 32),
);
check(
  'no shipped tile art is left blank',
  shippedTiles.every((tile) => tile.faceArt !== null && !isEntirelyBlank(tile.faceArt)),
);
check(
  'shipped tiles have unique names, symbols and ids',
  [
    shippedTiles.map((tile) => tile.name),
    shippedTiles.map((tile) => tile.symbol),
    shippedTiles.map((tile) => String(tile.id)),
  ].every((values) => new Set(values).size === shippedTiles.length),
);
check(
  'terrain roles keep the tile ids that saved pipelines reference',
  ['water', 'sand', 'grass', 'tree', 'rock'].every(
    (role, id) => shippedTiles[id]?.role === role,
  ),
);
check(
  'tile art generation is deterministic',
  JSON.stringify(defaultTiles()) === JSON.stringify(shippedTiles),
);

check('forward faces north with the camera at north', String(cameraRelativeStep(0, 1, 0)) === '0,-1');
check('forward faces east with the camera turned right', String(cameraRelativeStep(1, 1, 0)) === '1,0');
check('strafing right of south faces west', String(cameraRelativeStep(2, 0, 1)) === '-1,0');


const zoom = new ZoomScale(1, 0.25, 4);
zoom.applyWheelPixels(-420);
check('one wheel notch out doubles the zoom scale', Math.abs(zoom.current() - 2) < 1e-9);
zoom.applyWheelPixels(420);
check('scrolling back returns to the starting scale', Math.abs(zoom.current() - 1) < 1e-9);
zoom.applyWheelPixels(-4200);
check('zooming in stops at the maximum scale', zoom.current() === 4);
zoom.applyWheelPixels(42000);
check('zooming out stops at the minimum scale', zoom.current() === 0.25);

const pan = new PanOffset();
pan.shiftBy(3, -2);
check('panning accumulates in tiles', pan.tilesX() === 3 && pan.tilesY() === -2);
check('recentering reports that it moved the camera', pan.recenter() && pan.tilesX() === 0);
check('recentering an unpanned camera is a no-op', !pan.recenter());

const northView = { yaw: 0, worldPerPixel: 0.1, pitchRadians: Math.PI / 2 };
const draggedRight = worldPanForDrag({ dxPixels: 10, dyPixels: 0 }, northView);
check(
  'dragging right pulls the world right by moving the camera west',
  Math.abs(draggedRight.dx + 1) < 1e-9 && Math.abs(draggedRight.dy) < 1e-9,
);
const draggedDown = worldPanForDrag({ dxPixels: 0, dyPixels: 10 }, northView);
check(
  'dragging down looks further north',
  Math.abs(draggedDown.dy + 1) < 1e-9 && Math.abs(draggedDown.dx) < 1e-9,
);
const turnedRight = worldPanForDrag(
  { dxPixels: 10, dyPixels: 0 },
  { ...northView, yaw: Math.PI / 2 },
);
check(
  'dragging right with the camera turned right moves the camera north',
  Math.abs(turnedRight.dx) < 1e-9 && Math.abs(turnedRight.dy + 1) < 1e-9,
);
const shallowPitch = worldPanForDrag({ dxPixels: 0, dyPixels: 10 }, { ...northView, pitchRadians: Math.PI / 6 });
check('a shallower pitch covers more ground per vertical drag pixel', Math.abs(shallowPitch.dy) > 1);

check('a close camera streams the minimum chunk radius', streamingRadiusChunks(8) === 2);
check('zooming out streams more chunks', streamingRadiusChunks(120) > streamingRadiusChunks(40));
check('streaming radius stays capped when zoomed way out', streamingRadiusChunks(100000) === 6);

const randomizeTileIds = tileset.all().map((tile) => tile.id);

function paramWithinSpec(nodeType: string, name: string, value: unknown): boolean {
  const spec = nodeTypeOf(nodeType)?.params[name];
  if (!spec) return false;
  if (spec.kind === 'number' || spec.kind === 'int') {
    return typeof value === 'number' && value >= spec.min && value <= spec.max;
  }
  if (spec.kind === 'select') return typeof value === 'string' && spec.options.includes(value);
  return true;
}

function allParamsWithinSpecs(state: PipelineState): boolean {
  return state.nodes.every((node) =>
    Object.entries(node.params).every(([name, value]) => paramWithinSpec(node.type, name, value)),
  );
}

function sameStructure(a: PipelineState, b: PipelineState): boolean {
  return (
    a.nodes.length === b.nodes.length &&
    a.nodes.every(
      (node, i) =>
        node.id === b.nodes[i]!.id &&
        node.type === b.nodes[i]!.type &&
        JSON.stringify(node.inputs) === JSON.stringify(b.nodes[i]!.inputs),
    )
  );
}

const rolledOnce = randomWorldPipeline(mulberry32(7), randomizeTileIds);
const rolledTwice = randomWorldPipeline(mulberry32(7), randomizeTileIds);
check('random world rolls are deterministic per stream', JSON.stringify(rolledOnce) === JSON.stringify(rolledTwice));
check(
  'different streams roll different worlds',
  JSON.stringify(rolledOnce) !== JSON.stringify(randomWorldPipeline(mulberry32(8), randomizeTileIds)),
);
check(
  'random worlds survive sanitize unchanged',
  JSON.stringify(sanitizePipeline(rolledOnce)) === JSON.stringify(rolledOnce),
);
check('random worlds keep every param inside its declared range', allParamsWithinSpecs(rolledOnce));

let paintedWorlds = 0;
let sawTerrainRoll = false;
let sawMazeRoll = false;
const RANDOM_WORLD_ROLLS = 20;
for (let roll = 1; roll <= RANDOM_WORLD_ROLLS; roll++) {
  const rolled = sanitizePipeline(randomWorldPipeline(mulberry32(roll * 37), randomizeTileIds));
  const kinds = tileIdsInRegion(worldFromState(rolled).sampler, 48);
  kinds.delete(EMPTY_TILE);
  if (kinds.size >= 2) paintedWorlds++;
  if (rolled.nodes.some((node) => node.type === 'mazeChunk')) sawMazeRoll = true;
  if (rolled.nodes.some((node) => node.type === 'thresholdTiles')) sawTerrainRoll = true;
}
check('every random world paints at least two tile kinds', paintedWorlds === RANDOM_WORLD_ROLLS);
check('random worlds cover both terrain and maze recipes', sawTerrainRoll && sawMazeRoll);

const sliderBase = islandsState();
const sliderShuffled = permutedSliderParams(sliderBase, mulberry32(5));
check(
  'slider permutation is deterministic per stream',
  JSON.stringify(sliderShuffled) === JSON.stringify(permutedSliderParams(sliderBase, mulberry32(5))),
);
check('slider permutation preserves nodes and wiring', sameStructure(sliderBase, sliderShuffled));
check('slider permutation keeps params inside their declared ranges', allParamsWithinSpecs(sliderShuffled));
check(
  'slider permutation moves at least one slider',
  JSON.stringify(sliderShuffled.nodes.map((node) => node.params)) !==
    JSON.stringify(sliderBase.nodes.map((node) => node.params)),
);
check(
  'slider permutation leaves tiles and text params alone',
  sliderShuffled.nodes[1]!.params.belowTile === sliderBase.nodes[1]!.params.belowTile &&
    sliderShuffled.nodes[1]!.params.aboveTile === sliderBase.nodes[1]!.params.aboveTile &&
    sliderShuffled.nodes[4]!.params.tag === sliderBase.nodes[4]!.params.tag,
);
check(
  'slider permutation does not mutate its input state',
  JSON.stringify(sliderBase) === JSON.stringify(islandsState()),
);

const comboBase = islandsState();
const comboShuffled = permutedNodeCombination(comboBase, mulberry32(5), randomizeTileIds);
check(
  'node permutation is deterministic per stream',
  JSON.stringify(comboShuffled) ===
    JSON.stringify(permutedNodeCombination(comboBase, mulberry32(5), randomizeTileIds)),
);
check('node permutation changes the combination', !sameStructure(comboBase, comboShuffled));
check(
  'node permutation yields a pipeline that survives sanitize unchanged',
  JSON.stringify(sanitizePipeline(comboShuffled)) === JSON.stringify(comboShuffled),
);
check(
  'node permutation of an empty pipeline rolls fresh nodes',
  permutedNodeCombination(emptyPipeline(), mulberry32(3), randomizeTileIds).nodes.length > 0,
);
let comboWorks = true;
for (let roll = 1; roll <= 8; roll++) {
  const mutated = permutedNodeCombination(islandsState(), mulberry32(roll * 31), randomizeTileIds);
  if (JSON.stringify(sanitizePipeline(mutated)) !== JSON.stringify(mutated)) comboWorks = false;
  worldFromState(mutated).sampler.tileAt(5, 5);
}
check('repeated node permutations stay valid and generate without crashing', comboWorks);

const historyStates = new RandomizeHistory();
check('randomize history starts empty', !historyStates.canUndo() && historyStates.undo() === null);
historyStates.remember(islandsState());
const rememberedThenMutated = islandsState();
historyStates.remember(rememberedThenMutated);
rememberedThenMutated.nodes[0]!.params.scale = 0.29;
const restored = historyStates.undo();
check(
  'randomize history restores snapshots untouched by later edits',
  restored !== null && restored.nodes[0]!.params.scale !== 0.29 && historyStates.canUndo(),
);

function recenteringRenderer(recenterOnPlayer: () => void): WorldRenderer {
  return { redraw: () => {}, recenterOnPlayer };
}

function recenterViewsWhenPlayerMoves(world: World, views: WorldRenderer[]): void {
  const renderers = new WorldRenderers();
  for (const view of views) renderers.add(view);
  world.on('player-moved', () => renderers.recenterAll());
}

const pannedViews = [new PanOffset(), new PanOffset()];
pannedViews.forEach((offset) => offset.shiftBy(40, -25));
const walkableWorld = new World(() => true);
recenterViewsWhenPlayerMoves(
  walkableWorld,
  pannedViews.map((offset) => recenteringRenderer(() => void offset.recenter())),
);
check(
  'panning still holds before the player moves',
  pannedViews.every((offset) => offset.tilesX() !== 0),
);
walkableWorld.tryStep(1, 0);
check(
  'stepping snaps every view back onto the player',
  pannedViews.every((offset) => offset.tilesX() === 0 && offset.tilesY() === 0),
);

const walledWorld = new World(() => false);
const walledViewPan = new PanOffset();
walledViewPan.shiftBy(40, -25);
recenterViewsWhenPlayerMoves(walledWorld, [
  recenteringRenderer(() => void walledViewPan.recenter()),
]);
walledWorld.tryStep(1, 0);
check('a blocked step leaves the camera where the player put it', walledViewPan.tilesX() === 40);

function fieldAt(evaluator: PipelineEvaluator, nodeId: string, worldX: number, worldY: number): number {
  const cx = Math.floor(worldX / CHUNK_SIZE);
  const cy = Math.floor(worldY / CHUNK_SIZE);
  const field = asField(evaluator.valueFor(nodeId, cx, cy));
  return field ? field[(worldY - cy * CHUNK_SIZE) * CHUNK_SIZE + (worldX - cx * CHUNK_SIZE)]! : 0;
}

function tileAtNode(evaluator: PipelineEvaluator, nodeId: string, worldX: number, worldY: number): number {
  const cx = Math.floor(worldX / CHUNK_SIZE);
  const cy = Math.floor(worldY / CHUNK_SIZE);
  const tiles = asTiles(evaluator.valueFor(nodeId, cx, cy));
  return tiles ? tiles[(worldY - cy * CHUNK_SIZE) * CHUNK_SIZE + (worldX - cx * CHUNK_SIZE)]! : EMPTY_TILE;
}

function stateOfNodes(nodes: Array<Record<string, unknown>>): PipelineState {
  return sanitizePipeline({ seed: 5, nodes });
}

function terrainNodesState(): PipelineState {
  return stateOfNodes([
    { id: 'plates', type: 'tectonicUplift', params: { plateSize: 256, oceanFraction: 0.6, beltWidth: 64, rangeHeight: 0.34, landHeight: 0.58, basinDepth: 0.34 }, inputs: {} },
    { id: 'rolling', type: 'terrainNoise', params: { scale: 0.02, style: 0, octaves: 5, lacunarity: 2, gain: 0.5 }, inputs: {} },
    { id: 'ridged', type: 'terrainNoise', params: { scale: 0.02, style: 1, octaves: 5, lacunarity: 2, gain: 0.5 }, inputs: {} },
    { id: 'flat', type: 'constantField', params: { value: 0.7 }, inputs: {} },
    { id: 'unwarped', type: 'domainWarp', params: { strength: 0 }, inputs: { source: 'plates', offsetX: 'rolling' } },
    { id: 'warped', type: 'domainWarp', params: { strength: 40 }, inputs: { source: 'plates', offsetX: 'rolling' } },
    { id: 'keepA', type: 'blendFields', params: { weight: 0 }, inputs: { a: 'plates', b: 'rolling' } },
    { id: 'keepB', type: 'blendFields', params: { weight: 1 }, inputs: { a: 'plates', b: 'rolling' } },
    { id: 'flatSlope', type: 'slopeField', params: { radius: 2, gain: 40 }, inputs: { source: 'flat' } },
    { id: 'curved', type: 'hypsometricCurve', params: { seaLevel: 0.5, steepness: 9 }, inputs: { source: 'rolling' } },
  ]);
}

const terrainNodes = worldFromState(terrainNodesState());

function samplesOf(nodeId: string, span: number, evaluator = terrainNodes.evaluator): number[] {
  const values: number[] = [];
  for (let y = -span; y < span; y += 2) for (let x = -span; x < span; x += 2) values.push(fieldAt(evaluator, nodeId, x, y));
  return values;
}

check(
  'every terrain and water field node stays inside 0..1',
  ['plates', 'rolling', 'ridged', 'warped', 'curved'].every((nodeId) =>
    samplesOf(nodeId, 96).every((value) => value >= 0 && value <= 1),
  ),
);
check(
  'tectonic uplift produces both ocean basins and mountain belts',
  samplesOf('plates', 400).some((value) => value < 0.35) && samplesOf('plates', 400).some((value) => value > 0.75),
);
check(
  'ridged noise reaches higher crests than rolling noise from the same settings',
  Math.max(...samplesOf('ridged', 96)) > Math.max(...samplesOf('rolling', 96)),
);
check(
  'domain warp with zero strength is the source field, and with strength it is not',
  samplesOf('unwarped', 48).every((value, i) => Math.abs(value - samplesOf('plates', 48)[i]!) < 1e-6) &&
    samplesOf('warped', 48).some((value, i) => Math.abs(value - samplesOf('plates', 48)[i]!) > 1e-3),
);
check(
  'blend fields at weight 0 and 1 are exactly its two inputs',
  samplesOf('keepA', 48).every((value, i) => Math.abs(value - samplesOf('plates', 48)[i]!) < 1e-6) &&
    samplesOf('keepB', 48).every((value, i) => Math.abs(value - samplesOf('rolling', 48)[i]!) < 1e-6),
);
check('slope of a constant field is zero everywhere', samplesOf('flatSlope', 48).every((value) => value === 0));

const curveInput = samplesOf('rolling', 96);
const curveOutput = samplesOf('curved', 96);
check(
  'the hypsometric curve keeps sea level fixed and is monotone',
  curveInput.every((value, i) => Math.abs(value - 0.5) > 1e-4 || Math.abs(curveOutput[i]! - 0.5) < 1e-3) &&
    curveInput.every((value, i) => value <= 0.5 === curveOutput[i]! <= 0.5),
);
check(
  'the hypsometric curve clears heights away from sea level',
  curveOutput.filter((value) => Math.abs(value - 0.5) < 0.05).length <
    curveInput.filter((value) => Math.abs(value - 0.5) < 0.05).length,
);

function hydrologyState(): PipelineState {
  return stateOfNodes([
    { id: 'plates', type: 'tectonicUplift', params: { plateSize: 256, oceanFraction: 0.6, beltWidth: 64, rangeHeight: 0.34, landHeight: 0.58, basinDepth: 0.34 }, inputs: {} },
    { id: 'detail', type: 'terrainNoise', params: { scale: 0.02, style: 0, octaves: 5, lacunarity: 2, gain: 0.5 }, inputs: {} },
    { id: 'terrain', type: 'blendFields', params: { weight: 0.3 }, inputs: { a: 'plates', b: 'detail' } },
    { id: 'filled', type: 'fillDepressions', params: { seaLevel: 0.5, maxFill: 0.2, windowRadius: 40 }, inputs: { elevation: 'terrain' } },
    { id: 'flow', type: 'flowAccumulation', params: { seaLevel: 0.5, catchmentScale: 3000, fillPits: 1, windowRadius: 40 }, inputs: { elevation: 'terrain' } },
    { id: 'coast', type: 'coastDistance', params: { seaLevel: 0.5, range: 32 }, inputs: { elevation: 'terrain' } },
    { id: 'eroded', type: 'carveValleys', params: { depth: 0.08, minFlow: 0.4, valleyWidth: 6 }, inputs: { elevation: 'terrain', flow: 'flow' } },
    { id: 'rivers', type: 'riverFromFlow', params: { minFlow: 0.5, maxWidth: 1, seaLevel: 0.5, riverTile: 0 }, inputs: { flow: 'flow', elevation: 'terrain' } },
    { id: 'wideRivers', type: 'riverFromFlow', params: { minFlow: 0.5, maxWidth: 5, seaLevel: 0.5, riverTile: 0 }, inputs: { flow: 'flow', elevation: 'terrain' } },
  ]);
}

const hydrology = worldFromState(hydrologyState());
const hydrologyReversed = worldFromState(hydrologyState());
const flowForward = [fieldBytes(hydrology.evaluator, 'flow', 0, 0), fieldBytes(hydrology.evaluator, 'flow', 3, -2)];
const flowReversed = [fieldBytes(hydrologyReversed.evaluator, 'flow', 3, -2), fieldBytes(hydrologyReversed.evaluator, 'flow', 0, 0)];
check(
  'windowed water nodes are deterministic regardless of evaluation order',
  flowForward[0] === flowReversed[1] && flowForward[1] === flowReversed[0],
);

const hydrologyLoneChunk = worldFromState(hydrologyState());
check(
  'flow accumulation gives a chunk the same answer alone or beside its region neighbors',
  fieldBytes(hydrologyLoneChunk.evaluator, 'flow', 1, 1) ===
    fieldBytes(hydrology.evaluator, 'flow', 1, 1),
);
check(
  'coast distance gives a chunk the same answer alone or beside its region neighbors',
  fieldBytes(hydrologyLoneChunk.evaluator, 'coast', 2, 1) ===
    fieldBytes(hydrology.evaluator, 'coast', 2, 1),
);

const SPAN = 64;
const landCells: Array<[number, number]> = [];
for (let y = -SPAN; y < SPAN; y++) {
  for (let x = -SPAN; x < SPAN; x++) if (fieldAt(hydrology.evaluator, 'terrain', x, y) >= 0.5) landCells.push([x, y]);
}
check('the hydrology test world has land to drain', landCells.length > 0);
check(
  'filling depressions never lowers the ground',
  landCells.every(([x, y]) => fieldAt(hydrology.evaluator, 'filled', x, y) >= fieldAt(hydrology.evaluator, 'terrain', x, y) - 1e-6),
);
check(
  'no land cell of the filled surface is a closed pit',
  landCells.every(([x, y]) => {
    const here = fieldAt(hydrology.evaluator, 'filled', x, y);
    return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(
      ([dx, dy]) => fieldAt(hydrology.evaluator, 'filled', x + dx!, y + dy!) <= here,
    );
  }),
);
check(
  'carving valleys only ever removes material, and only near watercourses',
  landCells.every(([x, y]) => fieldAt(hydrology.evaluator, 'eroded', x, y) <= fieldAt(hydrology.evaluator, 'terrain', x, y) + 1e-6) &&
    landCells.some(([x, y]) => fieldAt(hydrology.evaluator, 'eroded', x, y) < fieldAt(hydrology.evaluator, 'terrain', x, y) - 1e-6) &&
    landCells.some(([x, y]) => Math.abs(fieldAt(hydrology.evaluator, 'eroded', x, y) - fieldAt(hydrology.evaluator, 'terrain', x, y)) < 1e-6),
);
check(
  'distance to coast puts land at or above 0.5 and sea below it',
  landCells.every(([x, y]) => fieldAt(hydrology.evaluator, 'coast', x, y) >= 0.5),
);

const flowRiverCells: Array<[number, number]> = [];
for (let y = -SPAN; y < SPAN; y++) {
  for (let x = -SPAN; x < SPAN; x++) if (tileAtNode(hydrology.evaluator, 'rivers', x, y) !== EMPTY_TILE) flowRiverCells.push([x, y]);
}
check('flow accumulation yields a river network', flowRiverCells.length > 0);
check(
  'every flow-derived river cell continues into another river cell or the sea',
  flowRiverCells.every(([x, y]) =>
    [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]].some(
      ([dx, dy]) =>
        tileAtNode(hydrology.evaluator, 'rivers', x + dx!, y + dy!) !== EMPTY_TILE ||
        fieldAt(hydrology.evaluator, 'terrain', x + dx!, y + dy!) < 0.5,
    ),
  ),
);
function isAwayFromChunkEdge(coord: number): boolean {
  const inChunk = ((coord % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
  return inChunk > 0 && inChunk < CHUNK_SIZE - 1;
}

function isInsideOwnChunk(x: number, y: number): boolean {
  return isAwayFromChunkEdge(x) && isAwayFromChunkEdge(y);
}

check(
  'river flow only grows downstream inside a chunk',
  flowRiverCells.filter(([x, y]) => isInsideOwnChunk(x, y)).every(([x, y]) => {
    const here = fieldAt(hydrology.evaluator, 'flow', x, y);
    return [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]].some(
      ([dx, dy]) =>
        fieldAt(hydrology.evaluator, 'flow', x + dx!, y + dy!) >= here ||
        fieldAt(hydrology.evaluator, 'terrain', x + dx!, y + dy!) < 0.5,
    );
  }),
);

let wideRiverCells = 0;
for (let y = -SPAN; y < SPAN; y++) {
  for (let x = -SPAN; x < SPAN; x++) if (tileAtNode(hydrology.evaluator, 'wideRivers', x, y) !== EMPTY_TILE) wideRiverCells++;
}
check('rivers widen with the max width knob', wideRiverCells > flowRiverCells.length);

function earthlikeState(): PipelineState {
  return sanitizePipeline(examplePipelines()[6]!.state);
}

const earthlike = worldFromState(earthlikeState());
const earthlikeAgain = worldFromState(earthlikeState());
check(
  'the earthlike preset regenerates identically from the same seed',
  tileBytes(earthlike.evaluator, 'n16', 1, 1) === tileBytes(earthlikeAgain.evaluator, 'n16', 1, 1) &&
    fieldBytes(earthlike.evaluator, 'n12', 1, 1) === fieldBytes(earthlikeAgain.evaluator, 'n12', 1, 1),
);
check(
  'the earthlike preset shows sea, beach, grass and rock around the origin',
  [0, 1, 2, 4].every((tile) => tileIdsInRegion(earthlike.sampler, 96).has(tile)),
);


const agentWorld = worldFromState(islandsState());
const godObs = buildObservation(agentWorld.sampler, tileset, { x: 0, y: 0, facing: 0 }, 'god');
check('god observation grid is GOD_VIEW_SIZE² with @ at the center', (() => {
  const center = Math.floor(GOD_VIEW_SIZE / 2);
  return (
    godObs.view.length === GOD_VIEW_SIZE &&
    godObs.view.every((row) => row.length === GOD_VIEW_SIZE) &&
    godObs.view[center]![center] === SELF_GLYPH
  );
})());
check('god observation states its facing', godObs.facing === 'north');

const charObs = buildObservation(agentWorld.sampler, tileset, { x: 0, y: 0, facing: 0 }, 'character');
check('character observation never states a facing', charObs.facing === null);
check('character observation blanks everything behind the agent', (() => {
  const center = Math.floor(CHARACTER_VIEW_SIZE_AT_DEFAULT_SIGHT / 2);
  for (let row = 0; row < CHARACTER_VIEW_SIZE_AT_DEFAULT_SIGHT; row++) {
    for (let column = 0; column < CHARACTER_VIEW_SIZE_AT_DEFAULT_SIGHT; column++) {
      const behind = !isInFrontHalfPlane(0, column - center, row - center);
      const isSelf = row === center && column === center;
      if (behind && !isSelf && charObs.view[row]![column] !== ' ') return false;
    }
  }
  return true;
})());
check('the character view grid is exactly wide enough to hold the sight radius', CHARACTER_VIEW_SIZE_AT_DEFAULT_SIGHT === DEFAULT_CHARACTER_SIGHT_RADIUS_TILES * 2 + 1);
check('the 2.5D fog turns opaque exactly at the sight radius', (() => {
  const fog = createCharacterFog();
  return fog.far === DEFAULT_CHARACTER_SIGHT_RADIUS_TILES && fog.near === hazeStartTiles();
})());
check('the character camera renders nothing past the fog', firstPersonCamera().camera.far === DEFAULT_CHARACTER_SIGHT_RADIUS_TILES);
check('the character camera stands in the player tile, so nothing behind the player can reach the screen', (() => {
  const camera = firstPersonCamera(3, 7, 2);
  const eye = camera.camera.position;
  return eye.x === 3.5 && eye.z === 7.5 && eye.y > 2 && eye.y < 2 + 2;
})());
check('the character camera looks along the facing it is given', (() => {
  const forward = new Vector3();
  const seen = new Set<string>();
  for (let facing = 0; facing < 8; facing++) {
    firstPersonCamera(0, 0, 0, facing as FacingIndex).camera.getWorldDirection(forward);
    const step = facingVector(facing as FacingIndex);
    if (Math.sign(round(forward.x)) !== step.dx || Math.sign(round(forward.z)) !== step.dy) {
      return false;
    }
    if (forward.y >= 0) return false;
    seen.add(`${round(forward.x)},${round(forward.z)}`);
  }
  return seen.size === 8;
})());
check('character observation blanks every tile the fog would swallow', (() => {
  const center = Math.floor(CHARACTER_VIEW_SIZE_AT_DEFAULT_SIGHT / 2);
  for (let row = 0; row < CHARACTER_VIEW_SIZE_AT_DEFAULT_SIGHT; row++) {
    for (let column = 0; column < CHARACTER_VIEW_SIZE_AT_DEFAULT_SIGHT; column++) {
      const dx = column - center;
      const dy = row - center;
      const isSelf = dx === 0 && dy === 0;
      const fogged = dx * dx + dy * dy > DEFAULT_CHARACTER_SIGHT_RADIUS_TILES * DEFAULT_CHARACTER_SIGHT_RADIUS_TILES;
      if (fogged && !isSelf && charObs.view[row]![column] !== ' ') return false;
    }
  }
  return true;
})());
check('the character sight test is the half-plane test bounded by the sight radius', (() => {
  for (let facing = 0; facing < 8; facing++) {
    for (let dy = -CHARACTER_VIEW_SIZE_AT_DEFAULT_SIGHT; dy <= CHARACTER_VIEW_SIZE_AT_DEFAULT_SIGHT; dy++) {
      for (let dx = -CHARACTER_VIEW_SIZE_AT_DEFAULT_SIGHT; dx <= CHARACTER_VIEW_SIZE_AT_DEFAULT_SIGHT; dx++) {
        const expected =
          isInFrontHalfPlane(facing as FacingIndex, dx, dy) &&
          dx * dx + dy * dy <= DEFAULT_CHARACTER_SIGHT_RADIUS_TILES * DEFAULT_CHARACTER_SIGHT_RADIUS_TILES;
        if (isWithinCharacterSight(facing as FacingIndex, dx, dy) !== expected) return false;
      }
    }
  }
  return true;
})());
check('a character observation stays smaller to read than a god observation', CHARACTER_VIEW_SIZE_AT_DEFAULT_SIGHT < GOD_VIEW_SIZE);
check('the character observation states its sight radius, the god one has none', charObs.sightRadiusTiles === DEFAULT_CHARACTER_SIGHT_RADIUS_TILES && godObs.sightRadiusTiles === null);
check('the character observation text names the sight radius', observationText(charObs).includes(`${DEFAULT_CHARACTER_SIGHT_RADIUS_TILES} tiles`));
check('every facing rotates the blank half of the character view', (() => {
  const center = Math.floor(CHARACTER_VIEW_SIZE_AT_DEFAULT_SIGHT / 2);
  const views = new Set<string>();
  for (let facing = 0; facing < 8; facing++) {
    const obs = buildObservation(
      agentWorld.sampler,
      tileset,
      { x: 0, y: 0, facing: facing as FacingIndex },
      'character',
    );
    views.add(obs.view.join('\n'));
    for (let row = 0; row < CHARACTER_VIEW_SIZE_AT_DEFAULT_SIGHT; row++) {
      for (let column = 0; column < CHARACTER_VIEW_SIZE_AT_DEFAULT_SIGHT; column++) {
        const visible = isWithinCharacterSight(facing as FacingIndex, column - center, row - center);
        if (!visible && !(row === center && column === center) && obs.view[row]![column] !== ' ') {
          return false;
        }
      }
    }
  }
  return views.size === 8;
})());
check('character legend appears only for visible glyphs plus the fixed entries', charObs.legend.every((entry) => entry.glyph === '@' || entry.glyph === ' ' || charObs.view.some((row) => row.includes(entry.glyph))));

const WIDE_SIGHT_RADIUS = 24;
const wideObs = buildObservation(agentWorld.sampler, tileset, { x: 0, y: 0, facing: 0 }, 'character', WIDE_SIGHT_RADIUS);
check('a widened sight radius widens the observation grid to match', wideObs.viewSize === characterViewSize(WIDE_SIGHT_RADIUS) && wideObs.view.length === wideObs.viewSize && wideObs.view.every((row) => row.length === wideObs.viewSize));
check('a widened observation reports the radius it was built with', wideObs.sightRadiusTiles === WIDE_SIGHT_RADIUS && observationText(wideObs).includes(`${WIDE_SIGHT_RADIUS} tiles`));
check('a widened sight radius still blanks everything behind and past the fog', (() => {
  const center = Math.floor(wideObs.viewSize / 2);
  for (let row = 0; row < wideObs.viewSize; row++) {
    for (let column = 0; column < wideObs.viewSize; column++) {
      const dx = column - center;
      const dy = row - center;
      if (dx === 0 && dy === 0) continue;
      const visible = isWithinCharacterSight(0, dx, dy, WIDE_SIGHT_RADIUS);
      if (!visible && wideObs.view[row]![column] !== ' ') return false;
    }
  }
  return true;
})());
check('a wider radius only adds ground: every tile the default radius showed reads the same', (() => {
  const wideCenter = Math.floor(wideObs.viewSize / 2);
  const nearCenter = Math.floor(CHARACTER_VIEW_SIZE_AT_DEFAULT_SIGHT / 2);
  let widened = false;
  for (let row = 0; row < CHARACTER_VIEW_SIZE_AT_DEFAULT_SIGHT; row++) {
    for (let column = 0; column < CHARACTER_VIEW_SIZE_AT_DEFAULT_SIGHT; column++) {
      const near = charObs.view[row]![column]!;
      const wide = wideObs.view[row - nearCenter + wideCenter]![column - nearCenter + wideCenter]!;
      if (near !== ' ' && near !== wide) return false;
      if (near === ' ' && wide !== ' ') widened = true;
    }
  }
  return widened;
})());
check('sight radii are clamped into the range the docs promise', clampSightRadiusTiles(0) === MIN_CHARACTER_SIGHT_RADIUS_TILES && clampSightRadiusTiles(1000) === MAX_CHARACTER_SIGHT_RADIUS_TILES && clampSightRadiusTiles(Number.NaN) === DEFAULT_CHARACTER_SIGHT_RADIUS_TILES && clampSightRadiusTiles(WIDE_SIGHT_RADIUS) === WIDE_SIGHT_RADIUS);
check('the default radius is inside the range agents may ask for', DEFAULT_CHARACTER_SIGHT_RADIUS_TILES >= MIN_CHARACTER_SIGHT_RADIUS_TILES && DEFAULT_CHARACTER_SIGHT_RADIUS_TILES <= MAX_CHARACTER_SIGHT_RADIUS_TILES);
check('the 2.5D fog and camera follow a widened sight radius', (() => {
  const fog = createCharacterFog(WIDE_SIGHT_RADIUS);
  const camera = firstPersonCamera();
  camera.setSightRadiusTiles(WIDE_SIGHT_RADIUS);
  return (
    fog.far === WIDE_SIGHT_RADIUS &&
    fog.near === hazeStartTiles(WIDE_SIGHT_RADIUS) &&
    fog.near < fog.far &&
    camera.camera.far === WIDE_SIGHT_RADIUS
  );
})());
check('haze always starts before the fog closes, at every radius agents may pick', (() => {
  for (let radius = MIN_CHARACTER_SIGHT_RADIUS_TILES; radius <= MAX_CHARACTER_SIGHT_RADIUS_TILES; radius++) {
    if (!(hazeStartTiles(radius) > 0 && hazeStartTiles(radius) < radius)) return false;
  }
  return true;
})());

const agentDocs = buildApiDocs(tileset);
check('api docs state the character sight radius and grid size', agentDocs.includes(`${DEFAULT_CHARACTER_SIGHT_RADIUS_TILES}-tile sight radius`) && agentDocs.includes(`${CHARACTER_VIEW_SIZE_AT_DEFAULT_SIGHT}x${CHARACTER_VIEW_SIZE_AT_DEFAULT_SIGHT}`));
check('api docs render with no unfilled placeholder', !/\{\{\w+\}\}/.test(agentDocs));
check('api docs list every ability of both modes', everyAbility().every((spec) => agentDocs.includes(`\`${spec.action}\``)));
check('api docs list every failure code', FAILURES.every((failure) => agentDocs.includes(`\`${failure.code}\``)));
check("api docs legend names every tileset symbol", tileset.all().every((tile) => agentDocs.includes(`'${tile.symbol}' = ${tile.name}`)));
check('api docs list every registered node type', allNodeTypes().every((def) => agentDocs.includes(`\`${def.type}\``)));
check('api docs render an example body for every ability that takes params', everyAbility().filter((spec) => Object.keys(spec.params).length > 0).every((spec) => agentDocs.includes(JSON.stringify(spec.example))));
check('api docs name the human control for every ability', everyAbility().every((spec) => agentDocs.includes(spec.humanControl)));
check('every registered node type serializes into the catalog', nodeTypesJson().types.length === allNodeTypes().length);

check('turning wraps in eighth turns', turnedFacing(7, 1) === 0 && turnedFacing(0, -1) === 7);
check('facing-relative steps never exceed one tile per axis', (() => {
  for (let facing = 0; facing < 8; facing++) {
    for (const forward of [-1, 0, 1]) {
      for (const strafe of [-1, 0, 1]) {
        const [dx, dy] = facingRelativeStep(facing as FacingIndex, forward, strafe);
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) return false;
      }
    }
  }
  return true;
})());
check('observation text and json carry the same grid', observationText(charObs).includes(charObs.view.join('\n')));

function abilityWorld() {
  const store = new PipelineStore(emptyPipeline());
  const abilityTileset = new Tileset();
  const prefabs = new PrefabLibrary(() => -1);
  const pose = { x: 0, y: 0, facing: 0 as FacingIndex };
  const sight: { radius: number } = { radius: DEFAULT_CHARACTER_SIGHT_RADIUS_TILES };
  const context = {
    store,
    tileset: abilityTileset,
    prefabs,
    creatures: new CreatureLibrary(),
    items: new ItemLibrary(),
    templates: new TemplateLibrary([]),
    worldPresets: new WorldPresetLibrary([]),
    randomizeHistory: new RandomizeHistory(),
    groundItems: NO_GROUND_ITEMS,
    puzzles: new PuzzleWorld(store, () => true),
    regionSampler: {
      tileAt: () => 0,
      elevationAt: () => 0,
      voxelColumnAt: () => null,
    },
    actor: {
      pose: () => pose,
      tryStep: (dx: number, dy: number) => ((pose.x += dx), (pose.y += dy), true),
      turn: (turns: number) => (pose.facing = turnedFacing(pose.facing, turns)),
      sightRadiusTiles: () => sight.radius,
      setSightRadiusTiles: (radius: number) => (sight.radius = clampSightRadiusTiles(radius)),
    },
  };
  return { context, store, pose, sight, prefabs, tileset: abilityTileset };
}

const abilities = abilityWorld();
const act = (mode: 'god' | 'character', action: string, params: Record<string, unknown> = {}) =>
  performAbility(abilities.context, mode, action, params);

check('an ability is refused to a mode that does not own it', (() => {
  const characterCompass = act('character', 'step_north');
  const godTurn = act('god', 'turn_left');
  const characterEdit = act('character', 'add_node', { type: 'noiseField' });
  return (
    !characterCompass.ok && characterCompass.code === 'unknown_action' &&
    !godTurn.ok && godTurn.code === 'unknown_action' &&
    !characterEdit.ok && characterEdit.code === 'unknown_action'
  );
})());
check('an unknown action lists the ones the mode does have', (() => {
  const result = act('god', 'set_fire_to_everything');
  return !result.ok && result.hint.includes('add_node');
})());
check('a missing required param is named, not guessed at', (() => {
  const result = act('god', 'set_param', { node_id: 'n1' });
  return !result.ok && result.code === 'bad_request' && result.hint.includes('param');
})());
check('moving and turning go through the same registry the API uses', (() => {
  const moved = act('god', 'step_east');
  const turned = act('character', 'turn_right');
  return moved.ok && abilities.pose.x === 1 && turned.ok && abilities.pose.facing === 1;
})());
check('set_sight_radius is a character power, and god mode has no such knob', (() => {
  const widened = act('character', 'set_sight_radius', { radius_tiles: 24 });
  const inGodMode = act('god', 'set_sight_radius', { radius_tiles: 24 });
  return (
    widened.ok &&
    widened.summary.includes('24') &&
    abilities.sight.radius === 24 &&
    !inGodMode.ok &&
    inGodMode.code === 'unknown_action'
  );
})());
check('set_sight_radius clamps rather than refusing, and says so', (() => {
  const tooFar = act('character', 'set_sight_radius', { radius_tiles: 5000 });
  const clampedTo = abilities.sight.radius;
  const tooNear = act('character', 'set_sight_radius', { radius_tiles: -10 });
  const narrowedTo = abilities.sight.radius;
  const back = act('character', 'set_sight_radius', {
    radius_tiles: DEFAULT_CHARACTER_SIGHT_RADIUS_TILES,
  });
  return (
    tooFar.ok && tooFar.summary.includes('clamped') && clampedTo === MAX_CHARACTER_SIGHT_RADIUS_TILES &&
    tooNear.ok && narrowedTo === MIN_CHARACTER_SIGHT_RADIUS_TILES &&
    back.ok && abilities.sight.radius === DEFAULT_CHARACTER_SIGHT_RADIUS_TILES
  );
})());
check('set_sight_radius refuses a radius that is not a number', (() => {
  const result = act('character', 'set_sight_radius', { radius_tiles: 'far' });
  return !result.ok && result.code === 'invalid_value';
})());
check('add_node rejects an unknown type', (() => {
  const result = act('god', 'add_node', { type: 'noSuchThing' });
  return !result.ok && result.code === 'unknown_node_type';
})());
check('add_node creates and reports the node', (() => {
  const result = act('god', 'add_node', { type: 'noiseField' });
  return result.ok && abilities.store.nodes().length === 1;
})());
const noiseId = abilities.store.nodes()[0]!.id;
check('set_param clamps a knob to its range', (() => {
  const result = act('god', 'set_param', { node_id: noiseId, param: 'scale', value: 999 });
  return result.ok && abilities.store.nodeById(noiseId)!.params.scale === 0.3;
})());
check('set_param names the real params on a miss', (() => {
  const result = act('god', 'set_param', { node_id: noiseId, param: 'nope', value: 1 });
  return !result.ok && result.code === 'unknown_param' && result.hint.includes('scale');
})());
check('threshold auto-wires to the noise field when added', (() => {
  const result = act('god', 'add_node', { type: 'thresholdTiles' });
  const threshold = abilities.store.nodes()[1];
  return result.ok && threshold?.type === 'thresholdTiles' && Object.values(threshold.inputs).includes(noiseId);
})());
const thresholdId = abilities.store.nodes()[1]!.id;
check('wire_input refuses a later source for an earlier node', (() => {
  const result = act('god', 'wire_input', { node_id: noiseId, input: 'field', source_node_id: thresholdId });
  return !result.ok && (result.code === 'invalid_wire' || result.code === 'unknown_param');
})());
check('set_display refuses a mode the output kind cannot take', (() => {
  const result = act('god', 'set_display', { node_id: noiseId, display: 'tileLayer' });
  return !result.ok && result.code === 'invalid_display';
})());
check('set_display binds elevation with a height scale', (() => {
  const result = act('god', 'set_display', { node_id: noiseId, display: 'elevation', height_scale: 5 });
  const display = abilities.store.nodeById(noiseId)!.display;
  return result.ok && display.mode === 'elevation' && display.heightScale === 5;
})());
check('set_display keeps the fields you leave out', (() => {
  act('god', 'set_display', { node_id: noiseId, display: 'elevation', height_scale: 7 });
  const kept = act('god', 'set_display', { node_id: noiseId, display: 'elevation' });
  const display = abilities.store.nodeById(noiseId)!.display;
  return kept.ok && display.mode === 'elevation' && display.heightScale === 7;
})());
check('set_seed reseeds the pipeline', (() => {
  const result = act('god', 'set_seed', { seed: 777 });
  return result.ok && abilities.store.seed() === 777;
})());
check('set_display rejects a prefab id the library does not have', (() => {
  const added = act('god', 'add_node', { type: 'scatterPoints' });
  const points = abilities.store.nodes()[abilities.store.nodes().length - 1]!;
  const bad = act('god', 'set_display', { node_id: points.id, display: 'prefabs', prefab_id: 9999 });
  const good = act('god', 'set_display', { node_id: points.id, display: 'creatures', creature_id: -1 });
  return added.ok && !bad.ok && bad.code === 'invalid_value' && good.ok;
})());
check('remove_node deletes and reports', (() => {
  const result = act('god', 'remove_node', { node_id: thresholdId });
  return result.ok && abilities.store.nodes().every((node) => node.id !== thresholdId);
})());
check('tiles can be created and edited through abilities', (() => {
  const before = abilities.tileset.all().length;
  const added = act('god', 'add_tile');
  const tileId = abilities.tileset.all()[abilities.tileset.all().length - 1]!.id;
  const named = act('god', 'update_tile', { tile_id: tileId, name: 'test tile', walkable: 0 });
  const tile = abilities.tileset.byId(tileId)!;
  return (
    added.ok && named.ok &&
    abilities.tileset.all().length === before + 1 &&
    tile.name === 'test tile' && tile.walkable === false
  );
})());
check('prefabs can be built voxel by voxel through abilities', (() => {
  const added = act('god', 'add_prefab');
  const prefab = abilities.prefabs.all()[abilities.prefabs.all().length - 1]!;
  const sized = act('god', 'resize_prefab', { prefab_id: prefab.id, width: 3, depth: 3, layers: 2 });
  const groundTile = abilities.tileset.all()[0]!.id;
  const painted = act('god', 'paint_prefab', { prefab_id: prefab.id, x: 1, y: 1, layer: 1, tile_id: groundTile });
  const outside = act('god', 'paint_prefab', { prefab_id: prefab.id, x: 9, y: 9, layer: 0, tile_id: groundTile });
  const filled = act('god', 'fill_prefab_layer', { prefab_id: prefab.id, layer: 0, tile_id: groundTile });
  const after = abilities.prefabs.byId(prefab.id)!;
  return (
    added.ok && sized.ok && painted.ok && filled.ok && !outside.ok &&
    after.width === 3 && after.layers === 2 &&
    after.voxels.filter((voxel) => voxel === groundTile).length === 10
  );
})());
check('creatures can be created and tuned through abilities', (() => {
  const added = act('god', 'add_creature');
  const creature = abilities.context.creatures.all()[abilities.context.creatures.all().length - 1]!;
  const tuned = act('god', 'update_creature', { creature_id: creature.id, behavior: 3, speed: 2.5 });
  const badBehavior = act('god', 'update_creature', { creature_id: creature.id, behavior: 99 });
  const after = abilities.context.creatures.byId(creature.id)!;
  return added.ok && tuned.ok && !badBehavior.ok && after.behavior === 3 && after.speed === 2.5;
})());
check('presets and templates round-trip through abilities', (() => {
  const saved = act('god', 'save_preset', { name: 'check preset' });
  const nodeIds = abilities.store.nodes().map((node) => node.id);
  const template = act('god', 'save_template', { name: 'check template', node_ids: nodeIds });
  const stamped = act('god', 'stamp_template', { name: 'check template' });
  const loaded = act('god', 'load_preset', { name: 'check preset' });
  const unknown = act('god', 'load_preset', { name: 'no such world' });
  return (
    saved.ok && template.ok && stamped.ok && loaded.ok &&
    !unknown.ok && unknown.code === 'unknown_preset' && unknown.hint.includes('check preset')
  );
})());
check('a roll can be seeded and undone', (() => {
  const before = JSON.stringify(abilities.store.snapshot());
  const rolled = act('god', 'randomize_sliders', { seed: 42 });
  const undone = act('god', 'undo_randomize');
  return rolled.ok && undone.ok && JSON.stringify(abilities.store.snapshot()) === before;
})());
check('capture_region lifts world tiles into a new prefab', (() => {
  const before = abilities.prefabs.all().length;
  const captured = act('god', 'capture_region', { min_x: 0, min_y: 0, max_x: 3, max_y: 3 });
  return captured.ok && abilities.prefabs.all().length === before + 1;
})());
check('every ability is reachable through the API dispatcher', everyAbility().every((spec) => abilityFor(spec.mode, spec.action) === spec));
check('character mode owns nothing but its own movement and senses, never the world editor', abilitiesForMode('character').every((spec) => spec.group === 'movement' || spec.group === 'senses'));
check('character mode can widen its own sight and nothing else senses-shaped', abilitiesForMode('character').filter((spec) => spec.group === 'senses').map((spec) => spec.action).join() === 'set_sight_radius');

checkOnlyTheAbilityLayerCanMutate(check);

const BIOME_SEA = 0;
const BIOME_SHORE = 1;
const BIOME_GROUND = 2;
const BIOME_ROCK = 4;
const BIOME_DEEP = 5;
const BIOME_SNOW = 7;

function biomeState(): PipelineState {
  return stateOfNodes([
    { id: 'terrain', type: 'terrainNoise', params: { scale: 0.02, style: 0, octaves: 5, lacunarity: 2, gain: 0.5 }, inputs: {} },
    { id: 'steep', type: 'slopeField', params: { radius: 3, gain: 40 }, inputs: { source: 'terrain' } },
    { id: 'shore', type: 'coastDistance', params: { seaLevel: 0.5, range: 32 }, inputs: { elevation: 'terrain' } },
    { id: 'half', type: 'constantField', params: { value: 1 }, inputs: {} },
    {
      id: 'biome',
      type: 'biomeBands',
      params: {
        seaLevel: 0.5, deepDrop: 0.06, shoreBand: 0.06, rockAbove: 0.45, snowLine: 0.8, regionAtLeast: 0.5,
        deepTile: BIOME_DEEP, waterTile: BIOME_SEA, shoreTile: BIOME_SHORE, groundTile: BIOME_GROUND,
        rockTile: BIOME_ROCK, snowTile: BIOME_SNOW,
      },
      inputs: { elevation: 'terrain', steepness: 'steep', shoreDistance: 'shore', region: null },
    },
    {
      id: 'maskedBiome',
      type: 'biomeBands',
      params: {
        seaLevel: 0.5, deepDrop: 0.06, shoreBand: 0.06, rockAbove: 0.45, snowLine: 0.8, regionAtLeast: 0.5,
        deepTile: BIOME_DEEP, waterTile: BIOME_SEA, shoreTile: BIOME_SHORE, groundTile: BIOME_GROUND,
        rockTile: BIOME_ROCK, snowTile: BIOME_SNOW,
      },
      inputs: { elevation: 'terrain', steepness: 'steep', shoreDistance: 'shore', region: 'terrain' },
    },
  ]);
}

const biome = worldFromState(biomeState());
const biomeTiles = new Set<number>();
for (let y = -48; y < 48; y++) {
  for (let x = -48; x < 48; x++) biomeTiles.add(tileAtNode(biome.evaluator, 'biome', x, y));
}
check('one biome node paints sea, shore, ground and rock from a single card', [BIOME_SEA, BIOME_SHORE, BIOME_GROUND, BIOME_ROCK].every((tile) => biomeTiles.has(tile)));
check('a biome node never leaves a cell empty when it has no region mask', !biomeTiles.has(EMPTY_TILE));
check(
  'water is deep only further below sea level than the deep cut point',
  everyCellInRegion(48, (x, y) => {
    const height = fieldAt(biome.evaluator, 'terrain', x, y);
    const tile = tileAtNode(biome.evaluator, 'biome', x, y);
    return tile !== BIOME_DEEP || height < 0.5 - 0.06;
  }),
);
check(
  'a region mask holds a biome back and leaves those cells to another layer',
  everyCellInRegion(48, (x, y) =>
    fieldAt(biome.evaluator, 'terrain', x, y) >= 0.5 ||
    tileAtNode(biome.evaluator, 'maskedBiome', x, y) === EMPTY_TILE),
);

function everyCellInRegion(span: number, holds: (x: number, y: number) => boolean): boolean {
  for (let y = -span; y < span; y++) {
    for (let x = -span; x < span; x++) if (!holds(x, y)) return false;
  }
  return true;
}

const foldedState = sanitizePipeline({
  seed: 3,
  nodes: [
    { id: 'a', type: 'terrainNoise', folder: 'terrain', params: {}, inputs: {} },
    { id: 'b', type: 'slopeField', folder: 'terrain', params: {}, inputs: { source: 'a' } },
    { id: 'c', type: 'coastDistance', folder: '', params: {}, inputs: { elevation: 'a' } },
    { id: 'd', type: 'terrainNoise', folder: 'terrain', params: {}, inputs: {} },
  ],
});
const runs = nodeFolderRuns(foldedState.nodes);
check(
  'adjacent nodes sharing a folder fold into one run, and a break starts a new one',
  runs.length === 3 && runs[0]!.nodes.length === 2 && runs[1]!.folder === '' && runs[2]!.startIndex === 3,
);
check(
  'folders survive sanitize and serialization',
  sanitizePipeline(JSON.parse(JSON.stringify(foldedState))).nodes.map((node) => node.folder).join() ===
    'terrain,terrain,,terrain',
);
check(
  'folders never reach the node signature, so grouping cannot change the world',
  [...computeNodeSignatures(foldedState).values()].join() ===
    [...computeNodeSignatures(sanitizePipeline({ seed: 3, nodes: foldedState.nodes.map((node) => ({ ...node, folder: 'renamed' })) })).values()].join(),
);

const templates = builtInTemplates();
check('every built-in template survives sanitize with all of its nodes', templates.length === 5 && templates.every((template) => template.nodes.length > 0));
check(
  'every built-in template describes itself and comments every node',
  templates.every((template) => template.description.length > 0 && template.nodes.every((node) => node.comment.length > 0)),
);

const stampTarget = sanitizePipeline({ seed: 8, nodes: [{ id: 'n1', type: 'terrainNoise', params: {}, inputs: {} }] });
const plates = templates.find((template) => template.name === 'tectonic plates')!;
const stamped = stampTemplateInto(stampTarget, plates, stampTarget.nodes.length);
check('stamping a template makes fresh ids that cannot collide', new Set(stampTarget.nodes.map((node) => node.id)).size === stampTarget.nodes.length);
check('a stamped template lands in a folder named after itself', stamped.every((node) => node.folder === plates.name));
check(
  'wiring inside a stamped template is remapped onto its new ids',
  stamped[3]!.inputs.source === stamped[0]!.id && stamped[3]!.inputs.offsetX === stamped[1]!.id,
);
const stampedWorld = worldFromState(stampTarget);
check(
  'a stamped template generates without error',
  stamped.every((node) => stampedWorld.evaluator.errorFor(node.id) === null) &&
    asField(stampedWorld.evaluator.valueFor(stamped[3]!.id, 0, 0)) !== null,
);

const capturedRun = nodeFolderRuns(sanitizePipeline(earthlikeState()).nodes).find((run) => run.folder === 'river valleys')!;
const captured = templateFromNodes(capturedRun.nodes, 'river valleys', 'captured from the preset');
check(
  'saving a folder as a template keeps wiring inside it and opens wiring to nodes outside',
  captured.nodes[1]!.inputs.flow === captured.nodes[0]!.id && captured.nodes[0]!.inputs.elevation === null,
);
check(
  'a saved template round-trips through storage',
  sanitizeTemplates(JSON.parse(JSON.stringify([captured]))).length === 1,
);
check('templates reject junk', sanitizeTemplates([{ name: '', nodes: [] }, null, 7]).length === 0);

function presetStateNamed(name: string): PipelineState {
  return sanitizePipeline(examplePipelines().find((preset) => preset.name === name)!.state);
}

function tileIdsInRect(
  sampler: WorldSampler,
  centerX: number,
  centerY: number,
  halfWidth: number,
  halfHeight: number,
): Set<number> {
  const seen = new Set<number>();
  for (let y = centerY - halfHeight; y < centerY + halfHeight; y++) {
    for (let x = centerX - halfWidth; x < centerX + halfWidth; x++) seen.add(sampler.tileAt(x, y));
  }
  return seen;
}

const metropolis = worldFromState(presetStateNamed('fallen metropolis'));
const metropolisAgain = worldFromState(presetStateNamed('fallen metropolis'));
check(
  'the fallen metropolis preset survives sanitize with all nodes',
  presetStateNamed('fallen metropolis').nodes.length === 28,
);
check(
  'the fallen metropolis regenerates identically from the same seed',
  fieldBytes(metropolis.evaluator, 'n9', 1, 1) === fieldBytes(metropolisAgain.evaluator, 'n9', 1, 1) &&
    tileBytes(metropolis.evaluator, 'n10', 1, 1) === tileBytes(metropolisAgain.evaluator, 'n10', 1, 1),
);
const metropolisTiles = tileIdsInRegion(metropolis.sampler, 96);
check(
  'the fallen metropolis shows stone walls, flagstone streets, rubble and reclaiming grass',
  [17, 16, 9, 2].every((tile) => metropolisTiles.has(tile)),
);
check('the risen sea drowns part of the fallen metropolis', metropolisTiles.has(0));
const districtFate = asField(metropolis.evaluator.valueFor('n9', 0, 0))!;
const districtFateEast = asField(metropolis.evaluator.valueFor('n9', 1, 0))!;
check(
  'district fate varies between districts but stays inside 0..1',
  JSON.stringify(Array.from(districtFate)) !== JSON.stringify(Array.from(districtFateEast)) &&
    [...districtFate, ...districtFateEast].every((value) => value >= 0 && value <= 1),
);

const climates = worldFromState(presetStateNamed('pole to equator'));
const climatesAgain = worldFromState(presetStateNamed('pole to equator'));
check(
  'the pole to equator preset survives sanitize with all nodes',
  presetStateNamed('pole to equator').nodes.length === 41,
);
check(
  'the pole to equator preset regenerates identically from the same seed',
  fieldBytes(climates.evaluator, 'n20', 1, 1) === fieldBytes(climatesAgain.evaluator, 'n20', 1, 1) &&
    tileBytes(climates.evaluator, 'n31', 0, -20) === tileBytes(climatesAgain.evaluator, 'n31', 0, -20),
);
const polarTiles = tileIdsInRect(climates.sampler, 0, -700, 96, 16);
const temperateTiles = tileIdsInRect(climates.sampler, 0, 0, 96, 16);
const desertTiles = tileIdsInRect(climates.sampler, 0, 700, 96, 16);
check('the far north of pole to equator is snow or ice', polarTiles.has(7) || polarTiles.has(6));
check('the middle latitudes of pole to equator grow grass', temperateTiles.has(2));
check('the far south of pole to equator is sand', desertTiles.has(1));
check(
  'grass belongs to the middle latitudes, not the polar cap',
  !polarTiles.has(2) && temperateTiles.has(2),
);

const marches = worldFromState(presetStateNamed('the ember marches'));
const marchesAgain = worldFromState(presetStateNamed('the ember marches'));
check(
  'the ember marches preset survives sanitize with all nodes',
  presetStateNamed('the ember marches').nodes.length === 51,
);
check(
  'the ember marches regenerates identically from the same seed',
  fieldBytes(marches.evaluator, 'n14', 1, 1) === fieldBytes(marchesAgain.evaluator, 'n14', 1, 1) &&
    tileBytes(marches.evaluator, 'n23', 15, -3) === tileBytes(marchesAgain.evaluator, 'n23', 15, -3),
);
const greenMarchTiles = tileIdsInRect(marches.sampler, -600, 0, 48, 32);
const ashfallTiles = tileIdsInRect(marches.sampler, 600, 0, 96, 64);
check('the green west of the ember marches grows grass', greenMarchTiles.has(2));
check(
  'the eastern ashfall is ash and lava, and grass does not grow there',
  ashfallTiles.has(22) && ashfallTiles.has(21) && !ashfallTiles.has(2),
);
const greenWardTiles = tileIdsInRect(marches.sampler, -480, -288, 24, 24);
check(
  'a western ward is a hedge labyrinth over worn paths',
  greenWardTiles.has(24) && greenWardTiles.has(8),
);
const fallenWardTiles = tileIdsInRect(marches.sampler, 480, 288, 24, 24);
check(
  'an eastern ward is scorched stone with ash-filled breaches, its hedges burnt away',
  fallenWardTiles.has(23) && fallenWardTiles.has(22) && !fallenWardTiles.has(24),
);
check(
  'the ember marches spawns every creature in its own country',
  ['n43', 'n47', 'n48', 'n49', 'n51'].every((nodeId) =>
    marches.store.nodes().some((node) => node.id === nodeId && node.display.mode === 'creatures'),
  ),
);

check(
  'a saved world preset round-trips through storage with its seed and nodes',
  (() => {
    const saved = sanitizeWorldPresets(
      JSON.parse(JSON.stringify([{ name: 'mine', description: 'combo', state: earthlikeState() }])),
    );
    return saved.length === 1 && saved[0]!.state.seed === earthlikeState().seed && saved[0]!.state.nodes.length === earthlikeState().nodes.length;
  })(),
);
check(
  'world presets reject junk',
  sanitizeWorldPresets([{ name: '', state: earthlikeState() }, { name: 'empty', state: { nodes: [] } }, null, 7]).length === 0,
);

check(
  'a color is transparent only when its alpha byte is zero',
  isTransparentInk('#00000000') &&
    isTransparentInk('#7bbf5a00') &&
    !isTransparentInk('#7bbf5a') &&
    !isTransparentInk('#7bbf5aff'),
);
check(
  'every color reaches three.js as six opaque digits',
  opaqueInk('#7bbf5aff') === '#7bbf5a' &&
    opaqueInk('#7bbf5a') === '#7bbf5a' &&
    opaqueInk(TRANSPARENT_INK) === '#000000',
);
check(
  'a color editor toggles transparency without losing the hue it had',
  withTransparency('#7bbf5a', true) === '#7bbf5a00' &&
    withTransparency(withTransparency('#7bbf5a', true), false) === '#7bbf5a' &&
    withTransparency(TRANSPARENT_INK, false) === '#000000',
);
check(
  'painting with a transparent color punches a hole rather than storing a color',
  (() => {
    const painted = floodFillFacePixels(blankFacePixels(4).fill('#ffffff'), 4, 0, null);
    return painted.every((pixel) => pixel === null);
  })(),
);

describe('prefabs and creatures', () => checkPrefabAndCreatureInvariants(check));
describe('items and inventories', () => checkItemAndInventoryInvariants(check));
describe('character billboards', () => checkCharacterBillboardInvariants(check));
describe('the player character', () => checkPlayerCharacterInvariants(check));
describe('tile heights', () => checkTileHeightInvariants(check));
describe('puzzle rooms', () => checkPuzzleInvariants(check));
describe('the dom boundary', () => checkPresentationFoldersAreTheOnlyDomCode(check));
describe('documentation', () => {
  checkDocumentationHasNotRegrown(check);
  checkClaudeMdPointsAtThingsThatExist(check);
});
describe('the design bets', () => checkDesignBetsStillHold(check));
describe('the api surface', () => checkEveryApiSurfaceIsDescribed(check));
describe('landmarks and ceilings', () => checkLandmarkAndCeilingInvariants(check));
describe('delve darkness', () => checkDelveDarknessInvariants(check));
describe('performance readouts', () => checkPerformanceReadouts(check));



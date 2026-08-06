import '../src/procgen/nodes';
import { checkPrefabAndCreatureInvariants } from './checkPrefabAndCreatureInvariants';
import { cameraRelativeStep } from '../src/input/cameraRelativeStep';
import { PipelineEvaluator } from '../src/procgen/eval/evaluator';
import { allNodeTypes } from '../src/procgen/nodeRegistry';
import { defaultParams, isKnobParamSpec, outputKindOf } from '../src/procgen/nodeType';
import { computeNodeSignatures } from '../src/procgen/pipeline/nodeSignatures';
import { emptyPipeline, type PipelineState } from '../src/procgen/pipeline/pipelineState';
import { PipelineStore } from '../src/procgen/pipeline/pipelineStore';
import { sanitizePipeline } from '../src/procgen/pipeline/sanitizePipeline';
import { examplePipelines } from '../src/procgen/presets/examplePipelines';
import { mulberry32 } from '../src/random/mulberry32';
import { permutedNodeCombination } from '../src/procgen/randomize/permuteNodeCombination';
import { permutedSliderParams } from '../src/procgen/randomize/permuteSliderParams';
import { RandomizeHistory } from '../src/procgen/randomize/randomizeHistory';
import { randomWorldPipeline } from '../src/procgen/randomize/randomWorldPipeline';
import { nodeTypeOf } from '../src/procgen/nodeRegistry';
import { CHUNK_SIZE } from '../src/procgen/chunk';
import { CARVER_CHOICES } from '../src/procgen/nodes/maze/mazeCarvers';
import { traceRiverDownhill } from '../src/procgen/nodes/rivers/traceRiverDownhill';
import { hashLatticePoint } from '../src/noise/hashLatticePoint';
import { EMPTY_TILE } from '../src/procgen/values/chunkValues';
import { asField, asPoints, asTiles } from '../src/procgen/values/valueAccess';
import { WorldSampler } from '../src/procgen/worldSampler';
import { asciiSnapshot } from '../src/views/ascii/asciiSnapshot';
import { PLAYER_GLYPH } from '../src/views/ascii/asciiCells';
import { PanOffset } from '../src/views/camera/panOffset';
import { ZoomScale } from '../src/views/camera/zoomScale';
import { cellPixelsFor, MAX_CELL_PX, MIN_CELL_PX } from '../src/views/ascii/asciiCellPixels';
import { viewportCoveringCanvas } from '../src/views/ascii/asciiViewport';
import { WorldRenderers, type WorldRenderer } from '../src/app/worldRenderers';
import { worldPanForDrag } from '../src/views/view3d/dragToWorldPan';
import { streamingRadiusChunks } from '../src/views/view3d/streamingRadius';
import { markerPlacementsForRect } from '../src/views/view3d/markerPlacements';
import { tilePlacementsForRect } from '../src/views/view3d/tilePlacements';
import { floodFillFacePixels } from '../src/ui/pixelArtEditor/ops/floodFillFacePixels';
import {
  copyFaceToAllSides,
  sideFacesMatch,
} from '../src/ui/pixelArtEditor/ops/linkedSideFaces';
import { mirroredPixelIndices } from '../src/ui/pixelArtEditor/ops/mirroredPixelIndices';
import { resizeCubeFaceArt } from '../src/ui/pixelArtEditor/ops/resizeFaceArt';
import { shiftFacePixelsWithWrap } from '../src/ui/pixelArtEditor/ops/shiftFacePixelsWithWrap';
import { upgradeStoredFaceArt } from '../src/world/tiles/legacyFaceArt';
import {
  blankCubeFaceArt,
  blankFacePixels,
  cloneCubeFaceArt,
  isCubeFaceArt,
  isEntirelyBlank,
  SIDE_FACES,
} from '../src/world/tiles/tileFaceArt';
import { defaultTiles } from '../src/world/tiles/defaultTiles';
import { Tileset } from '../src/world/tiles/tileset';
import { isWalkableTile } from '../src/world/tileWalkability';
import { World } from '../src/world/world';

const failures: string[] = [];
const tileset = new Tileset();

function check(name: string, condition: boolean): void {
  if (!condition) failures.push(name);
  console.log(`${condition ? 'ok  ' : 'FAIL'} ${name}`);
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
const markerPlacements = markerPlacementsForRect(sampled.sampler, -48, -48, 96, 96);
check(
  'marker placements carry the sourced tile face art',
  markerPlacements.length > 0 && markerPlacements.every((p) => p.faceArt === art),
);
tileset.update(treeId, { faceArt: defaultTiles()[treeId]?.faceArt ?? null });

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

const bigCanvas = { cssWidth: 1600, cssHeight: 900 };
check('zooming in far is capped to a readable cell size', cellPixelsFor(1000, bigCanvas) === MAX_CELL_PX);
check('zooming out far never draws sub-pixel cells', cellPixelsFor(0.0001, bigCanvas) >= MIN_CELL_PX);
check(
  'zooming out is bounded by the per-frame cell budget',
  cellPixelsFor(0.0001, bigCanvas) * cellPixelsFor(0.0001, bigCanvas) * 250_000 >= 1600 * 900 - 1,
);

const zoomedOut = viewportCoveringCanvas(10.5, -4.5, 4, bigCanvas);
check(
  'the viewport covers the whole canvas at any zoom',
  zoomedOut.subCellOffsetX + zoomedOut.columns * zoomedOut.cellPx >= bigCanvas.cssWidth &&
    zoomedOut.subCellOffsetY + zoomedOut.rows * zoomedOut.cellPx >= bigCanvas.cssHeight,
);
check(
  'the requested world point lands at the canvas center',
  Math.abs(
    zoomedOut.subCellOffsetX + (10.5 - zoomedOut.originX) * zoomedOut.cellPx -
      bigCanvas.cssWidth / 2,
  ) < 1e-9,
);
check(
  'sub-cell scrolling keeps the grid aligned to whole tiles',
  zoomedOut.subCellOffsetX <= 0 && zoomedOut.subCellOffsetX > -zoomedOut.cellPx,
);

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
  tileBytes(earthlike.evaluator, 'n20', 1, 1) === tileBytes(earthlikeAgain.evaluator, 'n20', 1, 1) &&
    fieldBytes(earthlike.evaluator, 'n12', 1, 1) === fieldBytes(earthlikeAgain.evaluator, 'n12', 1, 1),
);
check(
  'the earthlike preset shows sea, beach, grass and rock around the origin',
  [0, 1, 2, 4].every((tile) => tileIdsInRegion(earthlike.sampler, 96).has(tile)),
);


checkPrefabAndCreatureInvariants(check);

if (failures.length > 0) throw new Error(`${failures.length} check(s) failed: ${failures.join(', ')}`);
console.log('\nall checks passed');

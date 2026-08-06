import '../src/procgen/nodes';
import { cameraRelativeStep } from '../src/input/cameraRelativeStep';
import { PipelineEvaluator } from '../src/procgen/eval/evaluator';
import { allNodeTypes } from '../src/procgen/nodeRegistry';
import { defaultParams, isKnobParamSpec, outputKindOf } from '../src/procgen/nodeType';
import { computeNodeSignatures } from '../src/procgen/pipeline/nodeSignatures';
import { emptyPipeline, type PipelineState } from '../src/procgen/pipeline/pipelineState';
import { PipelineStore } from '../src/procgen/pipeline/pipelineStore';
import { sanitizePipeline } from '../src/procgen/pipeline/sanitizePipeline';
import { examplePipelines } from '../src/procgen/presets/examplePipelines';
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
tileset.update(grass.id, { faceArt: art });
const placements = tilePlacementsForRect(sampled.sampler, tileset, -48, -48, 96, 96);
check('placements carry the tile face art', placements.floors.some((p) => p.faceArt === art));
check('tiles without art stay flat-colored', placements.floors.some((p) => p.faceArt === null));
tileset.update(grass.id, { faceArt: null });

tileset.update(treeId, { faceArt: art });
const markerPlacements = markerPlacementsForRect(sampled.sampler, -48, -48, 96, 96);
check(
  'marker placements carry the sourced tile face art',
  markerPlacements.length > 0 && markerPlacements.every((p) => p.faceArt === art),
);
tileset.update(treeId, { faceArt: null });

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

if (failures.length > 0) throw new Error(`${failures.length} check(s) failed: ${failures.join(', ')}`);
console.log('\nall checks passed');

import '../src/procgen/nodes';
import { cameraRelativeStep } from '../src/input/cameraRelativeStep';
import { PipelineEvaluator } from '../src/procgen/eval/evaluator';
import { allNodeTypes } from '../src/procgen/nodeRegistry';
import { defaultParams, outputKindOf } from '../src/procgen/nodeType';
import { computeNodeSignatures } from '../src/procgen/pipeline/nodeSignatures';
import { emptyPipeline, type PipelineState } from '../src/procgen/pipeline/pipelineState';
import { PipelineStore } from '../src/procgen/pipeline/pipelineStore';
import { sanitizePipeline } from '../src/procgen/pipeline/sanitizePipeline';
import { examplePipelines } from '../src/procgen/presets/examplePipelines';
import { CHUNK_SIZE } from '../src/procgen/chunk';
import { EMPTY_TILE } from '../src/procgen/values/chunkValues';
import { asField, asPoints, asTiles } from '../src/procgen/values/valueAccess';
import { WorldSampler } from '../src/procgen/worldSampler';
import { asciiSnapshot } from '../src/views/ascii/asciiSnapshot';
import { PLAYER_GLYPH } from '../src/views/ascii/asciiCells';
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

check('node registry has example and custom nodes', allNodeTypes().length >= 6);
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
check('scatter markers appear with their tag', treeMarkers.length > 0 && treeMarkers.every((m) => m.tag === 'tree'));
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

if (failures.length > 0) throw new Error(`${failures.length} check(s) failed: ${failures.join(', ')}`);
console.log('\nall checks passed');

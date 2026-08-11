import { GABLE_ROOF, HIP_ROOF, wallLayersOf, type Culture } from '../assets/cultures/cultureDef';
import type { Piece } from '../assets/pieces/pieceDef';
import { assembleBuilding } from '../procgen/assembly/assembleBuilding';
import { footprintWithYard, massingFor } from '../procgen/assembly/buildingMassing';
import { BUILDING_PROGRAMS, massingRulesFor } from '../procgen/assembly/buildingPrograms';
import { roofVoxelsOf, type RoofVoxel } from '../procgen/assembly/buildingRoof';
import { doorCellOf, shellCellsOf, type ShellCell } from '../procgen/assembly/buildingShell';
import { stepOfFacing, type BuildingSpec } from '../procgen/assembly/buildingSpec';
import {
  buildingPointOf,
  buildingSeedKeyAt,
  specOfBuildingPoint,
} from '../procgen/assembly/buildingPoint';
import { FIRST_WALL_LAYER, FLOOR_LAYER } from '../procgen/assembly/buildingTileFallback';
import { NO_PIECES, type PieceSource } from '../procgen/assembly/pieceSource';
import { tileIdOfVoxel } from '../procgen/structureOverlay/packedVoxel';
import { hashString } from '../procgen/random/hashString';
import { mulberry32 } from '../procgen/random/mulberry32';
import {
  MAX_STRUCTURE_SIDE,
  StructureOverlay,
} from '../procgen/structureOverlay/structureOverlay';
import type { CheckReporter } from './checkReporter';

const SYNTHETIC_CULTURE_ID = 2;
const TWO_STORY_PROGRAM = 1;
const SHORT_STORY_LAYERS = 2;
const WALL_PIECE_LAYERS = 3;
const WALL_PIECE_ID = 41;
const WALL_PIECE_TILE_ID = 11;
const STRADDLING_ANCHOR = { x: 28, y: 28 };
const ROOF_CHECK_BOX = { x: 0, y: 0, width: 9, depth: 7 };

interface PaintedVoxel {
  x: number;
  y: number;
  layer: number;
  packed: number;
}

export function checkBuildingAssemblyInvariants(check: CheckReporter): void {
  checkAssemblyIsDeterministic(check);
  checkMassingStaysInsideTheOverlayReach(check);
  checkTilesAloneStillBuildAWholeBuilding(check);
  checkWallPiecesStackUpToTheRoofTheyCarry(check);
  checkRoofStepsRiseTowardTheRidgeTheyMeet(check);
  checkABuildingLooksTheSameFromEveryChunkItStraddles(check);
  checkSpecsSurviveTheirWorldPointTag(check);
}

function checkAssemblyIsDeterministic(check: CheckReporter): void {
  const spec = specAt(5, 7, 3, 2);
  check(
    'assembling one building twice paints exactly the same voxels in the same order',
    JSON.stringify(paintsOf(spec)) === JSON.stringify(paintsOf(spec)),
  );
  check(
    'two buildings of the same program at different places are laid out apart',
    JSON.stringify(paintsOf(spec)) !== JSON.stringify(paintsOf(specAt(60, 60, 3, 2))),
  );
}

function checkMassingStaysInsideTheOverlayReach(check: CheckReporter): void {
  const oversized: string[] = [];
  for (let program = 0; program < BUILDING_PROGRAMS.length; program++) {
    for (let seed = 0; seed < 200; seed++) {
      const boxes = massingFor(program, mulberry32(hashString(`massing:${program}:${seed}`)));
      if (footprintWithYard(program, boxes) > MAX_STRUCTURE_SIDE) oversized.push(`${program}:${seed}`);
    }
  }
  check(
    'no program ever masses a building whose footprint and yard outgrow the overlay reach',
    oversized.length === 0,
  );
}

function checkTilesAloneStillBuildAWholeBuilding(check: CheckReporter): void {
  const spec = specAt(5, 7, 0, 2);
  const painted = paintedIndex(paintsOf(spec));
  const shell = shellOf(spec);
  check(
    'a culture with no pieces bound still walls in every shell cell but the door',
    shell.walls.every((cell) => painted.has(voxelKey(spec, cell, FIRST_WALL_LAYER))),
  );
  check(
    'the street-facing wall of a tile-only building still opens a door',
    shell.door !== null && !painted.has(voxelKey(spec, shell.door, FIRST_WALL_LAYER)),
  );
  checkFloorsAndRoofsReachEveryInsideCell(check, spec, painted, shell);
}

function checkFloorsAndRoofsReachEveryInsideCell(
  check: CheckReporter,
  spec: BuildingSpec,
  painted: Map<string, number>,
  shell: { inside: ShellCell[] },
): void {
  check(
    'a tile-only building floors every cell it encloses',
    shell.inside.every(
      (cell) => painted.get(voxelKey(spec, cell, FLOOR_LAYER)) === packedFloorTile(),
    ),
  );
  check(
    'a tile-only building roofs every cell it floors',
    shell.inside.every((cell) => roofLayerCount(painted, spec, cell) > 0),
  );
}

function checkWallPiecesStackUpToTheRoofTheyCarry(check: CheckReporter): void {
  const spec = specAt(5, 7, TWO_STORY_PROGRAM, 2);
  const culture = shortStoriedCultureBoundToWallPiece();
  const wallLayers = wallLayersOf(culture, massingRulesFor(spec.program).stories);
  const painted = paintedIndex(paintsFromPieces(spec, culture));
  const shell = shellOf(spec);
  check(
    'a wall piece shorter or taller than a story still walls every layer the roof sits on',
    shell.walls.every((cell) => everyLayerPainted(painted, spec, cell, wallLayers)),
  );
  check(
    'no wall piece paints its wall above the course the roof starts from',
    !anyWallTileAbove(painted, wallLayers),
  );
}

function anyWallTileAbove(painted: Map<string, number>, wallLayers: number): boolean {
  return [...painted].some(
    ([key, packed]) => layerOfKey(key) > wallLayers && tileIdOfVoxel(packed) === WALL_PIECE_TILE_ID,
  );
}

function layerOfKey(key: string): number {
  return Number(key.split(',')[2]);
}

function checkRoofStepsRiseTowardTheRidgeTheyMeet(check: CheckReporter): void {
  const leaking = roofStylesWithSlopesStepping().filter((roof) => roof.leaks.length > 0);
  check(
    'every stepped roof course raises its step toward the course above, not the eave below',
    leaking.length === 0,
  );
}

function roofStylesWithSlopesStepping(): { style: number; leaks: RoofVoxel[] }[] {
  return [GABLE_ROOF, HIP_ROOF].map((style) => ({
    style,
    leaks: slopesFacingDownhill(roofVoxelsOf(ROOF_CHECK_BOX, style, FIRST_WALL_LAYER)),
  }));
}

function slopesFacingDownhill(voxels: readonly RoofVoxel[]): RoofVoxel[] {
  const layerByCell = new Map(voxels.map((voxel) => [`${voxel.x},${voxel.y}`, voxel.layer]));
  return voxels.filter((voxel) => !voxel.isRidge && stepsAwayFromTheRise(voxel, layerByCell));
}

function stepsAwayFromTheRise(voxel: RoofVoxel, layerByCell: Map<string, number>): boolean {
  const step = stepOfFacing(voxel.facing);
  const beyond = layerByCell.get(`${voxel.x + step[0]},${voxel.y + step[1]}`);
  return beyond !== undefined && beyond < voxel.layer;
}

function everyLayerPainted(
  painted: Map<string, number>,
  spec: BuildingSpec,
  cell: ShellCell,
  wallLayers: number,
): boolean {
  for (let layer = FIRST_WALL_LAYER; layer <= wallLayers; layer++) {
    if (!painted.has(voxelKey(spec, cell, layer))) return false;
  }
  return true;
}

function paintsFromPieces(spec: BuildingSpec, culture: Culture): PaintedVoxel[] {
  const painted: PaintedVoxel[] = [];
  assembleBuilding(spec, culture, oneWallPieceSource(), (x, y, layer, packed) =>
    painted.push({ x, y, layer, packed }),
  );
  return painted;
}

function oneWallPieceSource(): PieceSource {
  const piece = wallRunPieceOfLayers(WALL_PIECE_LAYERS);
  return { byId: (id) => (id === piece.id ? piece : undefined), largestFootprint: () => 1 };
}

function wallRunPieceOfLayers(layers: number): Piece {
  return {
    id: WALL_PIECE_ID,
    name: 'check wall run',
    role: 'wallSegment',
    width: 1,
    depth: 1,
    layers,
    anchorX: 0,
    anchorY: 0,
    voxels: new Array<number>(layers).fill(WALL_PIECE_TILE_ID),
    facings: new Array<number>(layers).fill(0),
  };
}

function shortStoriedCultureBoundToWallPiece(): Culture {
  const bound = [WALL_PIECE_ID];
  return {
    ...syntheticCulture(),
    storyLayers: SHORT_STORY_LAYERS,
    roleBindings: { wallSegment: bound, wallCorner: bound, window: bound, door: bound },
  };
}

function checkABuildingLooksTheSameFromEveryChunkItStraddles(check: CheckReporter): void {
  const spec = specAt(STRADDLING_ANCHOR.x, STRADDLING_ANCHOR.y, 3, 2);
  const overlay = straddlingOverlay(spec);
  const expected = paintedIndex(paintsOf(spec));
  const mismatches = [...expected].filter(
    ([key, packed]) => packedFromOverlay(overlay, key) !== packed,
  );
  check(
    'a building straddling four chunks paints the same voxel into each of them',
    mismatches.length === 0 && expected.size > 0,
  );
}

function checkSpecsSurviveTheirWorldPointTag(check: CheckReporter): void {
  const specs = BUILDING_PROGRAMS.map((_, program) => specAt(9, 11, program, program % 4));
  check(
    'every building spec survives the round trip through its world point payload',
    specs.every(
      (spec) => JSON.stringify(specOfBuildingPoint(buildingPointOf(spec))) === JSON.stringify(spec),
    ),
  );
  const bare = specOfBuildingPoint({ x: 3, y: 4, tag: 'town' });
  check(
    'a point placed by something other than the assembler still yields a buildable spec',
    bare.program === 0 && bare.seedKey === buildingSeedKeyAt(3, 4),
  );
}

function straddlingOverlay(spec: BuildingSpec): StructureOverlay {
  return new StructureOverlay(
    NO_PIECES,
    (chunkX, chunkY) =>
      chunkX === 0 && chunkY === 0
        ? [{ ...buildingPointOf(spec), cultureId: SYNTHETIC_CULTURE_ID }]
        : [],
    { byId: (id) => (id === SYNTHETIC_CULTURE_ID ? syntheticCulture() : undefined) },
  );
}

function packedFromOverlay(overlay: StructureOverlay, key: string): number | undefined {
  const [x, y, layer] = key.split(',').map(Number);
  return overlay.packedColumnAt(x!, y!)?.[layer!];
}

function shellOf(spec: BuildingSpec): {
  walls: ShellCell[];
  inside: ShellCell[];
  door: ShellCell | null;
} {
  const rng = mulberry32(hashString(spec.seedKey));
  const boxes = massingFor(spec.program, rng);
  const door = doorCellOf(boxes, spec.facing, rng);
  const cells = shellCellsOf(boxes);
  return {
    inside: cells,
    door,
    walls: cells.filter((cell) => cell.role !== 'floor' && !isSameCell(cell, door)),
  };
}

function roofLayerCount(
  painted: Map<string, number>,
  spec: BuildingSpec,
  cell: ShellCell,
): number {
  const wallLayers = syntheticCulture().storyLayers;
  return [...painted.keys()].filter((key) => isRoofVoxelOver(key, spec, cell, wallLayers)).length;
}

function isRoofVoxelOver(
  key: string,
  spec: BuildingSpec,
  cell: ShellCell,
  wallLayers: number,
): boolean {
  const [x, y, layer] = key.split(',').map(Number);
  return x === spec.x + cell.x && y === spec.y + cell.y && layer! > wallLayers;
}

function isSameCell(cell: ShellCell, other: ShellCell | null): boolean {
  return other !== null && cell.x === other.x && cell.y === other.y;
}

function paintsOf(spec: BuildingSpec): PaintedVoxel[] {
  const painted: PaintedVoxel[] = [];
  assembleBuilding(spec, syntheticCulture(), NO_PIECES, (x, y, layer, packed) =>
    painted.push({ x, y, layer, packed }),
  );
  return painted;
}

function paintedIndex(painted: readonly PaintedVoxel[]): Map<string, number> {
  return new Map(painted.map((voxel) => [`${voxel.x},${voxel.y},${voxel.layer}`, voxel.packed]));
}

function voxelKey(spec: BuildingSpec, cell: ShellCell, layer: number): string {
  return `${spec.x + cell.x},${spec.y + cell.y},${layer}`;
}

function packedFloorTile(): number {
  return syntheticCulture().floorTileId * 4;
}

function specAt(x: number, y: number, program: number, facing: number): BuildingSpec {
  return { x, y, program, facing, seedKey: buildingSeedKeyAt(x, y) };
}

function syntheticCulture(): Culture {
  return {
    id: SYNTHETIC_CULTURE_ID,
    name: 'check culture',
    roleBindings: {},
    wallTileId: 11,
    trimTileId: 12,
    roofSlopeTileId: 13,
    roofRidgeTileId: 14,
    floorTileId: 15,
    pathTileId: 16,
    roofStyle: 0,
    storyLayers: 3,
    windowEvery: 3,
  };
}

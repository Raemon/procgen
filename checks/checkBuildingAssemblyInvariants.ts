import type { Culture } from '../assets/cultures/cultureDef';
import { assembleBuilding } from '../procgen/assembly/assembleBuilding';
import { footprintWithYard, massingFor } from '../procgen/assembly/buildingMassing';
import { BUILDING_PROGRAMS } from '../procgen/assembly/buildingPrograms';
import { doorCellOf, shellCellsOf, type ShellCell } from '../procgen/assembly/buildingShell';
import type { BuildingSpec } from '../procgen/assembly/buildingSpec';
import { buildingSeedKeyAt, specToTag, tagToSpec } from '../procgen/assembly/buildingSpecTag';
import { FIRST_WALL_LAYER, FLOOR_LAYER } from '../procgen/assembly/buildingTileFallback';
import { NO_PIECES } from '../procgen/assembly/pieceSource';
import { hashString } from '../procgen/random/hashString';
import { mulberry32 } from '../procgen/random/mulberry32';
import {
  MAX_STRUCTURE_SIDE,
  StructureOverlay,
} from '../procgen/structureOverlay/structureOverlay';
import type { CheckReporter } from './checkReporter';

const SYNTHETIC_CULTURE_ID = 2;
const STRADDLING_ANCHOR = { x: 28, y: 28 };

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
    'every building spec survives the round trip through its world point tag',
    specs.every((spec) => JSON.stringify(tagToSpec(specToTag(spec), spec.x, spec.y)) === JSON.stringify(spec)),
  );
  check(
    'a point tagged by something other than the assembler still yields a buildable spec',
    tagToSpec('town', 3, 4).program === 0 && tagToSpec('town', 3, 4).seedKey === buildingSeedKeyAt(3, 4),
  );
}

function straddlingOverlay(spec: BuildingSpec): StructureOverlay {
  return new StructureOverlay(
    NO_PIECES,
    (chunkX, chunkY) =>
      chunkX === 0 && chunkY === 0
        ? [{ x: spec.x, y: spec.y, cultureId: SYNTHETIC_CULTURE_ID, tag: specToTag(spec) }]
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

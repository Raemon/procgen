import { wallLayersOf, type Culture } from '../../assets/cultures/cultureDef';
import type { PieceRole } from '../../assets/pieces/pieceDef';
import { hashString } from '../random/hashString';
import { mulberry32, type RandomStream } from '../random/mulberry32';
import { massingFor, type RoomBox } from './buildingMassing';
import { cellRng, pieceForRole, stampPieceThroughPaint } from './buildingPieceStamp';
import { massingRulesFor } from './buildingPrograms';
import { roofBaseLayerOf, roofVoxelsOf, type RoofVoxel } from './buildingRoof';
import {
  doorCellOf,
  isWindowCell,
  shellCellsOf,
  type ShellCell,
} from './buildingShell';
import type { BuildingSpec, PaintVoxel } from './buildingSpec';
import { furnishingSpotsOf } from './buildingStories';
import {
  FIRST_WALL_LAYER,
  FLOOR_LAYER,
  paintDoorColumn,
  paintTile,
  paintWallColumn,
} from './buildingTileFallback';
import type { PieceSource } from './pieceSource';

interface AssembledBuilding {
  spec: BuildingSpec;
  culture: Culture;
  pieces: PieceSource;
  paint: PaintVoxel;
  boxes: RoomBox[];
  door: ShellCell | null;
  wallLayers: number;
}

export function assembleBuilding(
  spec: BuildingSpec,
  culture: Culture,
  pieces: PieceSource,
  paint: PaintVoxel,
): void {
  const rng = mulberry32(hashString(spec.seedKey));
  const building = plannedBuilding(spec, culture, pieces, paint, rng);
  paintFloorsAndShell(building);
  paintRoofs(building);
  paintChimneys(building);
  paintFurnishings(building, rng);
}

function plannedBuilding(
  spec: BuildingSpec,
  culture: Culture,
  pieces: PieceSource,
  paint: PaintVoxel,
  rng: RandomStream,
): AssembledBuilding {
  const boxes = massingFor(spec.program, rng);
  return {
    spec,
    culture,
    pieces,
    paint,
    boxes,
    door: doorCellOf(boxes, spec.facing, rng),
    wallLayers: wallLayersOf(culture, massingRulesFor(spec.program).stories),
  };
}

function paintFloorsAndShell(building: AssembledBuilding): void {
  for (const cell of shellCellsOf(building.boxes)) {
    paintFloorCell(building, cell);
    if (cell.role !== 'floor') paintShellCell(building, cell);
  }
}

function paintFloorCell(building: AssembledBuilding, cell: ShellCell): void {
  const world = worldCellOf(building.spec, cell.x, cell.y);
  const piece = pieceAt(building, cell, 'floor');
  if (piece) return stampPieceThroughPaint(piece, 0, world.x, world.y, FLOOR_LAYER, building.paint);
  paintTile(building.paint, world.x, world.y, FLOOR_LAYER, building.culture.floorTileId, 0);
}

function paintShellCell(building: AssembledBuilding, cell: ShellCell): void {
  const role = shellPieceRoleOf(building, cell);
  const piece = pieceAt(building, cell, role);
  const world = worldCellOf(building.spec, cell.x, cell.y);
  if (piece) {
    return stampPieceThroughPaint(piece, cell.facing, world.x, world.y, FIRST_WALL_LAYER, building.paint);
  }
  paintShellTiles(building, cell, role, world);
}

function paintShellTiles(
  building: AssembledBuilding,
  cell: ShellCell,
  role: PieceRole,
  world: { x: number; y: number },
): void {
  const tileId = shellTileOf(building.culture, role);
  if (role === 'door') {
    return paintDoorColumn(building.paint, world.x, world.y, building.wallLayers, tileId, cell.facing);
  }
  paintWallColumn(building.paint, world.x, world.y, building.wallLayers, tileId, cell.facing);
}

function shellPieceRoleOf(building: AssembledBuilding, cell: ShellCell): PieceRole {
  if (isDoorCell(building.door, cell)) return 'door';
  if (cell.role === 'corner') return 'wallCorner';
  if (isWindowCell(cell, building.culture.windowEvery, building.door)) return 'window';
  return 'wallSegment';
}

function shellTileOf(culture: Culture, role: PieceRole): number {
  if (role === 'wallSegment') return culture.wallTileId;
  return culture.trimTileId >= 0 ? culture.trimTileId : culture.wallTileId;
}

function isDoorCell(door: ShellCell | null, cell: ShellCell): boolean {
  return door !== null && door.x === cell.x && door.y === cell.y;
}

function paintRoofs(building: AssembledBuilding): void {
  const baseLayer = roofBaseLayerOf(building.wallLayers);
  for (const box of building.boxes) {
    for (const voxel of roofVoxelsOf(box, building.culture.roofStyle, baseLayer)) {
      paintRoofVoxel(building, voxel, baseLayer);
    }
  }
}

function paintRoofVoxel(building: AssembledBuilding, voxel: RoofVoxel, baseLayer: number): void {
  const role = roofPieceRoleOf(voxel, baseLayer);
  const world = worldCellOf(building.spec, voxel.x, voxel.y);
  const piece = role ? pieceAt(building, voxel, role) : null;
  if (piece) {
    return stampPieceThroughPaint(piece, voxel.facing, world.x, world.y, voxel.layer, building.paint);
  }
  paintTile(building.paint, world.x, world.y, voxel.layer, roofTileOf(building.culture, voxel), voxel.facing);
}

function roofPieceRoleOf(voxel: RoofVoxel, baseLayer: number): PieceRole | null {
  if (voxel.isRidge) return 'roofRidge';
  return voxel.layer === baseLayer ? 'roofEdge' : null;
}

function roofTileOf(culture: Culture, voxel: RoofVoxel): number {
  const tileId = voxel.isRidge ? culture.roofRidgeTileId : culture.roofSlopeTileId;
  return tileId >= 0 ? tileId : culture.wallTileId;
}

function paintChimneys(building: AssembledBuilding): void {
  const baseLayer = roofBaseLayerOf(building.wallLayers);
  const box = building.boxes[0]!;
  for (let index = 0; index < massingRulesFor(building.spec.program).chimneys; index++) {
    paintChimney(building, { x: box.x + 1 + index * 2, y: box.y + 1 }, baseLayer);
  }
}

function paintChimney(
  building: AssembledBuilding,
  cell: { x: number; y: number },
  baseLayer: number,
): void {
  const world = worldCellOf(building.spec, cell.x, cell.y);
  const piece = pieceAt(building, cell, 'chimney');
  if (piece) return stampPieceThroughPaint(piece, 0, world.x, world.y, baseLayer, building.paint);
  const tileId = building.culture.trimTileId >= 0 ? building.culture.trimTileId : building.culture.wallTileId;
  for (let layer = baseLayer; layer <= baseLayer + 2; layer++) {
    paintTile(building.paint, world.x, world.y, layer, tileId, 0);
  }
}

function paintFurnishings(building: AssembledBuilding, rng: RandomStream): void {
  for (const spot of furnishingSpotsOf(building.spec.program, building.boxes, rng)) {
    const piece = pieceAt(building, spot, 'furnishing');
    const world = worldCellOf(building.spec, spot.x, spot.y);
    if (piece) stampPieceThroughPaint(piece, 0, world.x, world.y, FLOOR_LAYER, building.paint);
  }
}

function pieceAt(
  building: AssembledBuilding,
  cell: { x: number; y: number },
  role: PieceRole,
) {
  const rng = cellRng(building.spec.seedKey, cell.x, cell.y, role);
  return pieceForRole(building.culture, building.pieces, role, rng);
}

function worldCellOf(spec: BuildingSpec, x: number, y: number): { x: number; y: number } {
  return { x: spec.x + x, y: spec.y + y };
}

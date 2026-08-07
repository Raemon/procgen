import type { TilesChunk } from '../../values/chunkValues';
import { isOpenBetween, type CellMaze } from './cellMaze';
import type { RegionBorderDoors } from './mazeRegionDoors';
import type { MazeRegionLayout } from './mazeRegionLayout';

export function paintMazeWindow(
  tiles: TilesChunk,
  size: number,
  offsetX: number,
  offsetY: number,
  layout: MazeRegionLayout,
  maze: CellMaze,
  doors: RegionBorderDoors,
  wallTile: number,
  floorTile: number,
): TilesChunk {
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const floor = isMazeFloor(offsetX + x, offsetY + y, layout, maze, doors);
      tiles[y * size + x] = floor ? floorTile : wallTile;
    }
  }
  return tiles;
}

function isMazeFloor(
  regionX: number,
  regionY: number,
  layout: MazeRegionLayout,
  maze: CellMaze,
  doors: RegionBorderDoors,
): boolean {
  const latticeSpan = layout.cells * layout.pitch;
  const inEastRemainder = regionX >= latticeSpan;
  const inSouthRemainder = regionY >= latticeSpan;
  if (inEastRemainder && inSouthRemainder) return false;
  if (inEastRemainder) return isDoorCorridor(regionY, layout, doors.east);
  if (inSouthRemainder) return isDoorCorridor(regionX, layout, doors.south);
  return isLatticeFloor(regionX, regionY, layout, maze, doors);
}

function isDoorCorridor(crossCoord: number, layout: MazeRegionLayout, doorCells: number[]): boolean {
  const cell = Math.floor(crossCoord / layout.pitch);
  return crossCoord % layout.pitch >= layout.wall && doorCells.includes(cell);
}

function isLatticeFloor(
  regionX: number,
  regionY: number,
  layout: MazeRegionLayout,
  maze: CellMaze,
  doors: RegionBorderDoors,
): boolean {
  const cellX = Math.floor(regionX / layout.pitch);
  const cellY = Math.floor(regionY / layout.pitch);
  const inRoomX = regionX % layout.pitch >= layout.wall;
  const inRoomY = regionY % layout.pitch >= layout.wall;
  if (inRoomX && inRoomY) return true;
  if (!inRoomX && !inRoomY) return false;
  if (!inRoomX) return isWestPassageOpen(cellX, cellY, maze, doors);
  return isNorthPassageOpen(cellX, cellY, maze, doors);
}

function isWestPassageOpen(
  cellX: number,
  cellY: number,
  maze: CellMaze,
  doors: RegionBorderDoors,
): boolean {
  if (cellX === 0) return doors.west.includes(cellY);
  return isOpenBetween(maze, { x: cellX - 1, y: cellY }, { x: cellX, y: cellY });
}

function isNorthPassageOpen(
  cellX: number,
  cellY: number,
  maze: CellMaze,
  doors: RegionBorderDoors,
): boolean {
  if (cellY === 0) return doors.north.includes(cellX);
  return isOpenBetween(maze, { x: cellX, y: cellY - 1 }, { x: cellX, y: cellY });
}

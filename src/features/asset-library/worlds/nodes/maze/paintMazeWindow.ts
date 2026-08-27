import { EMPTY_TILE, type TilesChunk } from '../../values/chunkValues';
import { isOpenBetween, type CellMaze } from './cellMaze';
import type { RegionBorderDoors } from './mazeRegionDoors';
import type { MazeRegionLayout } from './mazeRegionLayout';
import { cellsShareARoom, type MazeRooms } from './mazeRooms';

export interface MazeWindow {
  layout: MazeRegionLayout;
  maze: CellMaze;
  doors: RegionBorderDoors;
  rooms: MazeRooms;
}

export function paintMazeWindow(
  tiles: TilesChunk,
  size: number,
  offsetX: number,
  offsetY: number,
  window: MazeWindow,
  wallTile: number,
  floorTile: number,
): TilesChunk {
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      tiles[y * size + x] = paintedTile(offsetX + x, offsetY + y, window, wallTile, floorTile);
    }
  }
  return tiles;
}

function paintedTile(
  regionX: number,
  regionY: number,
  window: MazeWindow,
  wallTile: number,
  floorTile: number,
): number {
  if (isOutsideTheMask(regionX, regionY, window)) return EMPTY_TILE;
  return isMazeFloor(regionX, regionY, window) ? floorTile : wallTile;
}

function isOutsideTheMask(regionX: number, regionY: number, window: MazeWindow): boolean {
  const { layout, maze } = window;
  const cellX = Math.min(layout.cells - 1, Math.floor(regionX / layout.pitch));
  const cellY = Math.min(layout.cells - 1, Math.floor(regionY / layout.pitch));
  return maze.blocked[cellY * maze.cells + cellX] === 1;
}

function isMazeFloor(regionX: number, regionY: number, window: MazeWindow): boolean {
  const { layout, doors } = window;
  const latticeSpan = layout.cells * layout.pitch;
  const inEastRemainder = regionX >= latticeSpan;
  const inSouthRemainder = regionY >= latticeSpan;
  if (inEastRemainder && inSouthRemainder) return false;
  if (inEastRemainder) return isDoorCorridor(regionY, layout, doors.east);
  if (inSouthRemainder) return isDoorCorridor(regionX, layout, doors.south);
  return isLatticeFloor(regionX, regionY, window);
}

function isDoorCorridor(crossCoord: number, layout: MazeRegionLayout, doorCells: number[]): boolean {
  const cell = Math.floor(crossCoord / layout.pitch);
  return crossCoord % layout.pitch >= layout.wall && doorCells.includes(cell);
}

function isLatticeFloor(regionX: number, regionY: number, window: MazeWindow): boolean {
  const { layout } = window;
  const cellX = Math.floor(regionX / layout.pitch);
  const cellY = Math.floor(regionY / layout.pitch);
  const inRoomX = regionX % layout.pitch >= layout.wall;
  const inRoomY = regionY % layout.pitch >= layout.wall;
  if (inRoomX && inRoomY) return true;
  if (!inRoomX && !inRoomY) return isPillarInsideARoom(cellX, cellY, window);
  if (!inRoomX) return isWestPassageOpen(cellX, cellY, window);
  return isNorthPassageOpen(cellX, cellY, window);
}

function isPillarInsideARoom(cellX: number, cellY: number, window: MazeWindow): boolean {
  return cellsShareARoom(window.rooms, [
    { x: cellX - 1, y: cellY - 1 },
    { x: cellX, y: cellY - 1 },
    { x: cellX - 1, y: cellY },
    { x: cellX, y: cellY },
  ]);
}

function isWestPassageOpen(cellX: number, cellY: number, window: MazeWindow): boolean {
  if (cellsShareARoom(window.rooms, [{ x: cellX - 1, y: cellY }, { x: cellX, y: cellY }])) {
    return true;
  }
  if (cellX === 0) return window.doors.west.includes(cellY);
  return isOpenBetween(window.maze, { x: cellX - 1, y: cellY }, { x: cellX, y: cellY });
}

function isNorthPassageOpen(cellX: number, cellY: number, window: MazeWindow): boolean {
  if (cellsShareARoom(window.rooms, [{ x: cellX, y: cellY - 1 }, { x: cellX, y: cellY }])) {
    return true;
  }
  if (cellY === 0) return window.doors.north.includes(cellX);
  return isOpenBetween(window.maze, { x: cellX, y: cellY - 1 }, { x: cellX, y: cellY });
}

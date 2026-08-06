import type { TilesChunk } from '../../values/chunkValues';
import type { CellMaze } from './cellMaze';
import type { EdgeDoors } from './mazeEdgeDoors';
import type { MazeLattice } from './mazeLattices';

export function paintMazeTiles(
  tiles: TilesChunk,
  size: number,
  lattice: MazeLattice,
  maze: CellMaze,
  doors: EdgeDoors,
  wallTile: number,
  floorTile: number,
): TilesChunk {
  tiles.fill(wallTile);
  paintCellFloors(tiles, size, lattice, maze, floorTile);
  paintPassages(tiles, size, lattice, maze, floorTile);
  paintEdgeDoors(tiles, size, lattice, doors, floorTile);
  return tiles;
}

function fillRect(
  tiles: TilesChunk,
  size: number,
  x: number,
  y: number,
  width: number,
  height: number,
  tile: number,
): void {
  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) tiles[(y + dy) * size + (x + dx)] = tile;
  }
}

function paintCellFloors(
  tiles: TilesChunk,
  size: number,
  lattice: MazeLattice,
  maze: CellMaze,
  floorTile: number,
): void {
  for (let cy = 0; cy < maze.cells; cy++) {
    for (let cx = 0; cx < maze.cells; cx++) {
      fillRect(tiles, size, floorStart(lattice, cx), floorStart(lattice, cy), lattice.room, lattice.room, floorTile);
    }
  }
}

function floorStart(lattice: MazeLattice, cellIndex: number): number {
  return cellIndex * lattice.pitch + lattice.wall;
}

function paintPassages(
  tiles: TilesChunk,
  size: number,
  lattice: MazeLattice,
  maze: CellMaze,
  floorTile: number,
): void {
  for (let cy = 0; cy < maze.cells; cy++) {
    for (let cx = 0; cx < maze.cells; cx++) {
      const id = cy * maze.cells + cx;
      if (maze.eastOpen[id]) {
        fillRect(tiles, size, floorStart(lattice, cx) + lattice.room, floorStart(lattice, cy), lattice.wall, lattice.room, floorTile);
      }
      if (maze.southOpen[id]) {
        fillRect(tiles, size, floorStart(lattice, cx), floorStart(lattice, cy) + lattice.room, lattice.room, lattice.wall, floorTile);
      }
    }
  }
}

function paintEdgeDoors(
  tiles: TilesChunk,
  size: number,
  lattice: MazeLattice,
  doors: EdgeDoors,
  floorTile: number,
): void {
  for (const row of doors.westRows) {
    fillRect(tiles, size, 0, floorStart(lattice, row), lattice.wall, lattice.room, floorTile);
  }
  for (const col of doors.northCols) {
    fillRect(tiles, size, floorStart(lattice, col), 0, lattice.room, lattice.wall, floorTile);
  }
}

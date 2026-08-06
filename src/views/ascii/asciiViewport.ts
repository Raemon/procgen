import type { Grid } from '../../world/grid';

export interface AsciiViewport {
  originX: number;
  originY: number;
  lastX: number;
  lastY: number;
  padCellsX: number;
  padCellsY: number;
}

export function viewportFollowingPlayer(
  grid: Grid,
  playerX: number,
  playerY: number,
  columns: number,
  rows: number,
): AsciiViewport {
  const originX = scrollOriginFollowing(playerX, columns, grid.width);
  const originY = scrollOriginFollowing(playerY, rows, grid.height);
  return {
    originX,
    originY,
    lastX: Math.min(grid.width, originX + columns),
    lastY: Math.min(grid.height, originY + rows),
    padCellsX: centeringPadCells(columns, grid.width),
    padCellsY: centeringPadCells(rows, grid.height),
  };
}

function scrollOriginFollowing(focus: number, span: number, worldSize: number): number {
  if (worldSize <= span) return 0;
  return Math.max(0, Math.min(worldSize - span, focus - Math.floor(span / 2)));
}

function centeringPadCells(span: number, worldSize: number): number {
  return Math.max(0, Math.floor((span - worldSize) / 2));
}

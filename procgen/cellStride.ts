export const FINE_STRIDE = 1;

export const MAX_STRIDE = 256;

export function clampedStride(stride: number): number {
  return Math.min(MAX_STRIDE, Math.max(FINE_STRIDE, Math.round(stride)));
}

export function worldCoordOfCell(cellCoord: number, stride: number): number {
  return cellCoord * stride;
}

export function cellCoordOfWorld(worldCoord: number, stride: number): number {
  return Math.floor(worldCoord / stride);
}

export function cellsSpanningTiles(tiles: number, stride: number): number {
  return Math.max(1, Math.round(tiles / stride));
}

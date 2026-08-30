export const DEFAULT_GOD_VIEW_SIZE_TILES = 33;
export const MIN_GOD_VIEW_SIZE_TILES = 9;
export const MAX_GOD_VIEW_SIZE_TILES = 161;

export function clampGodViewSizeTiles(sizeTiles: number): number {
  if (!Number.isFinite(sizeTiles)) return DEFAULT_GOD_VIEW_SIZE_TILES;
  return Math.min(
    MAX_GOD_VIEW_SIZE_TILES,
    Math.max(MIN_GOD_VIEW_SIZE_TILES, nearestOdd(sizeTiles)),
  );
}

export function godViewCostMultiplier(sizeTiles: number): number {
  const ratio = sizeTiles / DEFAULT_GOD_VIEW_SIZE_TILES;
  return ratio * ratio;
}

function nearestOdd(sizeTiles: number): number {
  return Math.round((sizeTiles - 1) / 2) * 2 + 1;
}

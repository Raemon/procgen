import type { TileId } from '@/features/asset-library/asset';
export interface RecipeTiles {
  all: readonly TileId[];
  walkable: readonly TileId[];
  blockers: readonly TileId[];
}

export interface TileFacts {
  id: TileId;
  walkable: boolean;
}

export function recipeTilesOf(
  tiles: readonly TileFacts[],
  limitTo?: readonly TileId[],
): RecipeTiles {
  const kept = limitTo ? tiles.filter((tile) => limitTo.includes(tile.id)) : tiles;
  return {
    all: kept.map((tile) => tile.id),
    walkable: kept.filter((tile) => tile.walkable).map((tile) => tile.id),
    blockers: kept.filter((tile) => !tile.walkable).map((tile) => tile.id),
  };
}

export function idsOnly(ids: readonly TileId[]): RecipeTiles {
  return { all: ids, walkable: ids, blockers: [] };
}

export function preferring(tiles: RecipeTiles, wanted: 'walkable' | 'blockers'): readonly TileId[] {
  const preferred = tiles[wanted];
  return preferred.length > 0 ? preferred : tiles.all;
}

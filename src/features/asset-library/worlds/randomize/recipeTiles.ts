export interface RecipeTiles {
  all: readonly number[];
  walkable: readonly number[];
  blockers: readonly number[];
}

export interface TileFacts {
  id: number;
  walkable: boolean;
}

export function recipeTilesOf(
  tiles: readonly TileFacts[],
  limitTo?: readonly number[],
): RecipeTiles {
  const kept = limitTo ? tiles.filter((tile) => limitTo.includes(tile.id)) : tiles;
  return {
    all: kept.map((tile) => tile.id),
    walkable: kept.filter((tile) => tile.walkable).map((tile) => tile.id),
    blockers: kept.filter((tile) => !tile.walkable).map((tile) => tile.id),
  };
}

export function idsOnly(ids: readonly number[]): RecipeTiles {
  return { all: ids, walkable: ids, blockers: [] };
}

export function preferring(tiles: RecipeTiles, wanted: 'walkable' | 'blockers'): readonly number[] {
  const preferred = tiles[wanted];
  return preferred.length > 0 ? preferred : tiles.all;
}

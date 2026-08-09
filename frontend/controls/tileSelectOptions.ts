import type { ReadOnlyTileAssets } from '../readOnlyAssets';

export function tileSelectOptions(
  tileAssets: ReadOnlyTileAssets,
  noTileText: string,
): { value: string; text: string }[] {
  return [
    { value: '-1', text: noTileText },
    ...tileAssets.all().map((tile) => ({ value: String(tile.id), text: `${tile.symbol} ${tile.name}` })),
  ];
}

import type { ReadOnlyTileset } from '../../app/readOnlyLibraries';

export function tileSelectOptions(
  tileset: ReadOnlyTileset,
  noTileText: string,
): { value: string; text: string }[] {
  return [
    { value: '-1', text: noTileText },
    ...tileset.all().map((tile) => ({ value: String(tile.id), text: `${tile.symbol} ${tile.name}` })),
  ];
}

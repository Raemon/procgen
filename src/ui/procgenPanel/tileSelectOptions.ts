import type { Tileset } from '../../world/tiles/tileset';

export function tileSelectOptions(
  tileset: Tileset,
  noTileText: string,
): { value: string; text: string }[] {
  return [
    { value: '-1', text: noTileText },
    ...tileset.all().map((tile) => ({ value: String(tile.id), text: `${tile.symbol} ${tile.name}` })),
  ];
}

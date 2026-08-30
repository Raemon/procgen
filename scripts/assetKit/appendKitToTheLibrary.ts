import { assetId } from '@/features/asset-library/asset';
import type { AssetKit, AssetLibrary } from '@/features/asset-library/generation/assetKit';
import type { AssetLibraryInTheDatabase } from './assetLibraryInTheDatabase';

export function generatorViewOf(library: AssetLibraryInTheDatabase): AssetLibrary {
  const tiles = library.tileAssets.all();
  return {
    tileNames: tiles.map((tile) => tile.name),
    tileSymbols: tiles.map((tile) => tile.symbol),
    cultureNames: library.cultures.all().map((culture) => culture.name),
    nextTileId: assetId<'tiles'>(nextIdAfter(tiles)),
    nextPieceId: assetId<'pieces'>(nextIdAfter(library.pieces.all())),
    nextCultureId: assetId<'cultures'>(nextIdAfter(library.cultures.all())),
  };
}

export function appendKitToTheLibrary(kit: AssetKit, library: AssetLibraryInTheDatabase): void {
  for (const tile of kit.tiles) library.tileAssets.insert(tile);
  for (const piece of kit.pieces) library.pieces.insert(piece);
  library.cultures.insert(kit.culture);
}

function nextIdAfter(assets: ReadonlyArray<{ id: number }>): number {
  return assets.reduce((highest, asset) => Math.max(highest, asset.id + 1), 0);
}

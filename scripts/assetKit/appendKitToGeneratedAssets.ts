import type { AssetKit, AssetLibrary } from '@/features/asset-library/generation/assetKit';
import { assetId } from '@/features/asset-library/asset';
import { defaultCultures } from '@/features/asset-library/cultures/defaultCultures';
import { defaultPieces } from '@/features/asset-library/pieces/defaultPieces';
import { defaultTiles } from '@/features/asset-library/tiles/defaultTiles';
import { readGeneratedAssets, writeGeneratedAssets } from './generatedAssetsModule';

export function libraryTheAppAlreadyHolds(): AssetLibrary {
  const tiles = defaultTiles();
  return {
    tileNames: tiles.map((tile) => tile.name),
    tileSymbols: tiles.map((tile) => tile.symbol),
    cultureNames: defaultCultures().map((culture) => culture.name),
    nextTileId: assetId<'tiles'>(nextIdAfter(tiles)),
    nextPieceId: assetId<'pieces'>(nextIdAfter(defaultPieces())),
    nextCultureId: assetId<'cultures'>(nextIdAfter(defaultCultures())),
  };
}

export function appendKitToGeneratedAssets(kit: AssetKit): void {
  const generated = readGeneratedAssets();
  writeGeneratedAssets({
    ...generated,
    tiles: [...generated.tiles, ...kit.tiles],
    pieces: [...generated.pieces, ...kit.pieces],
    cultures: [...generated.cultures, kit.culture],
  });
}

function nextIdAfter(assets: ReadonlyArray<{ id: number }>): number {
  return assets.reduce((next, asset) => Math.max(next, asset.id + 1), 0);
}

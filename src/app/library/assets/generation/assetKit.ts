import type { Culture } from '../cultures/cultureDef';
import type { Piece } from '../pieces/pieceDef';
import type { TileDef } from '../tiles/tileDef';
import { generateKitCulture } from './kitCulture';
import { generateKitPalette, type KitPalette } from './kitPalette';
import { generateKitPieces } from './kitPieces';
import { generatedPlaceName } from './kitPlaceName';
import { kitStream } from './kitRandom';
import { generateKitTiles } from './kitTiles';

export interface AssetLibrary {
  tileNames: readonly string[];
  tileSymbols: readonly string[];
  cultureNames: readonly string[];
  nextTileId: number;
  nextPieceId: number;
  nextCultureId: number;
}

export interface AssetKit {
  name: string;
  palette: KitPalette;
  tiles: TileDef[];
  pieces: Piece[];
  culture: Culture;
}

export function generateAssetKit(seed: number, library: AssetLibrary): AssetKit {
  const name = generatedPlaceName(kitStream(seed, 'place'), library.cultureNames);
  const palette = generateKitPalette(seed);
  const tiles = generateKitTiles(seed, palette, namingContextOf(library));
  const pieces = generateKitPieces(seed, name, tiles.idBySlot, library.nextPieceId);
  const culture = generateKitCulture(seed, name, tiles.idBySlot, pieces, library.nextCultureId);
  return { name, palette, tiles: tiles.tiles, pieces, culture };
}

function namingContextOf(library: AssetLibrary) {
  return {
    takenNames: library.tileNames,
    takenSymbols: library.tileSymbols,
    firstId: library.nextTileId,
  };
}

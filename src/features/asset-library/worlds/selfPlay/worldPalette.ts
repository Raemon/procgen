import { assetId, type TileId } from '@/features/asset-library/asset';
import { generateAssetKit } from '@/features/asset-library/generation/assetKit';
import type { Culture } from '@/features/asset-library/cultures/cultureDef';
import type { Piece } from '@/features/asset-library/pieces/pieceDef';
import type { TileDef } from '@/features/asset-library/tiles/tileDef';
import { mulberry32 } from '../random/mulberry32';
import { shuffled } from '../randomize/randomRolls';

export interface WorldPalette {
  name: string;
  tiles: TileDef[];
  pieces: Piece[];
  culture: Culture;
  paletteIds: TileId[];
}

const EMPTY_LIBRARY = {
  tileNames: [],
  tileSymbols: [],
  cultureNames: [],
  nextTileId: assetId<'tiles'>(0),
  nextPieceId: assetId<'pieces'>(0),
  nextCultureId: assetId<'cultures'>(0),
};

export function worldPaletteOfKit(
  kitSeed: number,
  accentKitSeed: number,
  paletteSize: number,
): WorldPalette {
  const kit = generateAssetKit(kitSeed, EMPTY_LIBRARY);
  const tiles = [...kit.tiles, ...accentTilesOf(accentKitSeed, kitSeed, assetId<'tiles'>(kit.tiles.length))];
  return {
    name: kit.name,
    tiles,
    pieces: kit.pieces,
    culture: kit.culture,
    paletteIds: paletteMostlyGround(tiles, paletteSize, kitSeed),
  };
}

function accentTilesOf(accentKitSeed: number, kitSeed: number, firstId: TileId): TileDef[] {
  if (accentKitSeed === kitSeed) return [];
  return generateAssetKit(accentKitSeed, { ...EMPTY_LIBRARY, nextTileId: firstId }).tiles;
}

const GROUND_SHARE_OF_PALETTE = 0.6;

function paletteMostlyGround(
  tiles: readonly TileDef[],
  paletteSize: number,
  kitSeed: number,
): TileId[] {
  const random = mulberry32(kitSeed);
  const ground = shuffled(random, tiles.filter((tile) => tile.walkable));
  const blockers = shuffled(random, tiles.filter((tile) => !tile.walkable));
  const groundWanted = Math.ceil(paletteSize * GROUND_SHARE_OF_PALETTE);
  return [
    ...drawnCycling(ground, groundWanted),
    ...drawnCycling(blockers, paletteSize - groundWanted),
  ];
}

function drawnCycling(tiles: readonly TileDef[], wanted: number): TileId[] {
  if (tiles.length === 0) return [];
  return Array.from({ length: wanted }, (_each, at) => tiles[at % tiles.length]!.id);
}

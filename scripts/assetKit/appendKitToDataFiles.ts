import type { AssetKit } from '../../assets/generation/assetKit';
import { tilesAsStoredJson } from '../../assets/tiles/tileStorage';
import {
  CULTURES_PATH,
  PIECES_PATH,
  TILES_PATH,
  writeJsonArray,
  type AssetDataFiles,
} from './assetDataFiles';

export function appendKitToDataFiles(kit: AssetKit, files: AssetDataFiles): void {
  writeJsonArray(TILES_PATH, [...files.tiles, ...tilesAsStoredJson(kit.tiles)]);
  writeJsonArray(PIECES_PATH, [...files.pieces, ...kit.pieces]);
  writeJsonArray(CULTURES_PATH, [...files.cultures, kit.culture]);
}

import { readFileSync, writeFileSync } from 'node:fs';
import type { AssetLibrary } from '../../assets/generation/assetKit';

export const TILES_PATH = 'data/tiles.json';
export const PIECES_PATH = 'data/pieces.json';
export const CULTURES_PATH = 'data/cultures.json';

interface StoredAsset {
  id?: number;
  name?: string;
  symbol?: string;
}

export interface AssetDataFiles {
  tiles: StoredAsset[];
  pieces: StoredAsset[];
  cultures: StoredAsset[];
}

export function readAssetDataFiles(): AssetDataFiles {
  return {
    tiles: readJsonArray(TILES_PATH),
    pieces: readJsonArray(PIECES_PATH),
    cultures: readJsonArray(CULTURES_PATH),
  };
}

export function libraryOfDataFiles(files: AssetDataFiles): AssetLibrary {
  return {
    tileNames: files.tiles.map((tile) => tile.name ?? ''),
    tileSymbols: files.tiles.map((tile) => tile.symbol ?? ''),
    cultureNames: files.cultures.map((culture) => culture.name ?? ''),
    nextTileId: nextIdAfter(files.tiles),
    nextPieceId: nextIdAfter(files.pieces),
    nextCultureId: nextIdAfter(files.cultures),
  };
}

export function writeJsonArray(path: string, entries: readonly unknown[]): void {
  writeFileSync(path, `${JSON.stringify(entries, null, 2)}\n`);
}

function readJsonArray(path: string): StoredAsset[] {
  const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'));
  return Array.isArray(parsed) ? (parsed as StoredAsset[]) : [];
}

function nextIdAfter(entries: readonly StoredAsset[]): number {
  return entries.reduce((next, entry) => Math.max(next, (entry.id ?? -1) + 1), 0);
}

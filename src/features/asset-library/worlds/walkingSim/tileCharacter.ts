import type { TileId } from '@/features/asset-library/asset';
import type { TileAssets } from '@/features/asset-library/tiles/tileAssets';
import { storedTileHeight } from '@/features/asset-library/tiles/tileHeight';
import type { TileDef } from '@/features/asset-library/tiles/tileDef';
import { EMPTY_TILE } from '../values/chunkValues';

export const VOID_CHARACTER = 'void';

const HUE_BANDS = 6;
const TALLEST_BAND = 3;

export type TileCharacterOf = (tileId: TileId) => string;

export function tileCharacterProbe(tileAssets: TileAssets): TileCharacterOf {
  const cache = new Map<number, string>();
  return (tileId) => {
    const hit = cache.get(tileId);
    if (hit !== undefined) return hit;
    const character = characterOfTile(tileAssets.byId(tileId), tileId);
    cache.set(tileId, character);
    return character;
  };
}

function characterOfTile(tile: TileDef | undefined, tileId: TileId): string {
  if (tileId === EMPTY_TILE || !tile) return VOID_CHARACTER;
  return [footingOf(tile), heightBandOf(tile), hueBandOfHex(tile.color)].join('/');
}

function footingOf(tile: TileDef): string {
  return tile.walkable ? 'floor' : 'block';
}

function heightBandOf(tile: TileDef): number {
  return Math.min(TALLEST_BAND, Math.round(storedTileHeight(tile)));
}

export function hueBandOfHex(hex: string): number {
  const channels = channelsOfHex(hex);
  if (!channels) return 0;
  return Math.floor(hueOfChannels(channels) * HUE_BANDS) % HUE_BANDS;
}

function channelsOfHex(hex: string): [number, number, number] | null {
  const digits = hex.replace('#', '');
  if (digits.length < 6) return null;
  return [0, 2, 4].map((at) => parseInt(digits.slice(at, at + 2), 16) / 255) as [
    number,
    number,
    number,
  ];
}

function hueOfChannels([red, green, blue]: [number, number, number]): number {
  const high = Math.max(red, green, blue);
  const spread = high - Math.min(red, green, blue);
  if (spread === 0) return 0;
  return positiveTurn(sextantOf(high, spread, red, green, blue) / 6);
}

function sextantOf(
  high: number,
  spread: number,
  red: number,
  green: number,
  blue: number,
): number {
  if (high === red) return (green - blue) / spread;
  if (high === green) return 2 + (blue - red) / spread;
  return 4 + (red - green) / spread;
}

function positiveTurn(turn: number): number {
  return turn - Math.floor(turn);
}

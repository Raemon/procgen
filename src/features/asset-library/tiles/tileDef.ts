import type { TileId } from '../asset';
import { clampLightRadius, DEFAULT_LIGHT_INK } from '@/features/game/light/lightEmission';
import type { CubeFaceArt } from './tileFaceArt';
import { DEFAULT_TILE_SHAPE, sealedShapeNearestTo, type TileShapeKind } from './tileShapeKind';
import { storedTileHeight, WALKABLE_TILE_HEIGHT } from './tileHeight';

export type TileRole = 'water' | 'sand' | 'grass' | 'tree' | 'rock';

export interface TileDef {
  id: TileId;
  name: string;
  symbol: string;
  color: string;
  walkable: boolean;
  height: number;
  role: TileRole | null;
  shape: TileShapeKind;
  faceArt: CubeFaceArt | null;
  textureId: string | null;
  light: number;
  lightInk: string;
}

export function newTileWithId(id: TileId): TileDef {
  return {
    id,
    name: `tile ${id}`,
    symbol: '?',
    color: '#888888',
    walkable: true,
    height: WALKABLE_TILE_HEIGHT,
    role: null,
    shape: DEFAULT_TILE_SHAPE,
    faceArt: null,
    textureId: null,
    light: 0,
    lightInk: DEFAULT_LIGHT_INK,
  };
}

export function tileSealedWhenBlocking(tile: TileDef): TileDef {
  if (tile.walkable) return tile;
  return { ...tile, shape: sealedShapeNearestTo(tile.shape), height: storedTileHeight(tile) };
}

export function tileWithSanitizedLight(tile: TileDef): TileDef {
  return {
    ...tile,
    light: clampLightRadius(tile.light),
    lightInk: typeof tile.lightInk === 'string' ? tile.lightInk : DEFAULT_LIGHT_INK,
  };
}

import type { CubeFaceArt } from './tileFaceArt';
import { WALKABLE_TILE_HEIGHT } from './tileHeight';

export type TileRole = 'water' | 'sand' | 'grass' | 'tree' | 'rock';

export interface TileDef {
  id: number;
  name: string;
  symbol: string;
  color: string;
  walkable: boolean;
  height: number;
  role: TileRole | null;
  faceArt: CubeFaceArt | null;
}

export function newTileWithId(id: number): TileDef {
  return {
    id,
    name: `tile ${id}`,
    symbol: '?',
    color: '#888888',
    walkable: true,
    height: WALKABLE_TILE_HEIGHT,
    role: null,
    faceArt: null,
  };
}

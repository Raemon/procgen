import type { CubeFaceArt } from './tileFaceArt';

export type TileRole = 'water' | 'sand' | 'grass' | 'tree' | 'rock';

export interface TileDef {
  id: number;
  name: string;
  symbol: string;
  color: string;
  walkable: boolean;
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
    role: null,
    faceArt: null,
  };
}

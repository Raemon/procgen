export type TileRole = 'water' | 'sand' | 'grass' | 'tree' | 'rock';

export interface TileDef {
  id: number;
  name: string;
  symbol: string;
  color: string;
  walkable: boolean;
  role: TileRole | null;
}

export function defaultTiles(): TileDef[] {
  return [
    { id: 0, name: 'water', symbol: '~', color: '#3a6ea5', walkable: false, role: 'water' },
    { id: 1, name: 'sand', symbol: '.', color: '#d8c07a', walkable: true, role: 'sand' },
    { id: 2, name: 'grass', symbol: '"', color: '#5a8f4e', walkable: true, role: 'grass' },
    { id: 3, name: 'tree', symbol: '♠', color: '#2d6a34', walkable: false, role: 'tree' },
    { id: 4, name: 'rock', symbol: '#', color: '#7a7a72', walkable: false, role: 'rock' },
  ];
}

export function newTileWithId(id: number): TileDef {
  return { id, name: `tile ${id}`, symbol: '?', color: '#888888', walkable: true, role: null };
}

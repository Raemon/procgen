import { DEFAULT_LIGHT_INK } from '../../world/light/lightEmission';
import { newTileWithId, type TileDef, type TileRole } from './tileDef';
import { defaultHeightForTile } from './tileHeight';
import type { TileShapeKind } from './tileShapeKind';

interface TileEntry {
  name: string;
  symbol: string;
  color: string;
  walkable: boolean;
  role: TileRole | null;
  shape?: TileShapeKind;
  height?: number;
  light?: number;
  lightInk?: string;
}

const POOL_HEIGHT = 1;
const OAK_HEIGHT = 2.6;
const PINE_HEIGHT = 3.2;
const BUSH_HEIGHT = 1.6;
const KNEE_HEIGHT = 0.5;
const EMBER_INK = '#ff8a3c';
const LANTERN_INK = '#ffcf7a';

const TILE_CATALOG = [
  { name: 'sea water', symbol: '~', color: '#33546b', walkable: false, role: 'water', height: POOL_HEIGHT },
  { name: 'shore sand', symbol: '.', color: '#c9b892', walkable: true, role: 'sand' },
  { name: 'meadow grass', symbol: '"', color: '#6d8a55', walkable: true, role: 'grass' },
  { name: 'oak tree', symbol: '♠', color: '#41663c', walkable: false, role: 'tree', height: OAK_HEIGHT },
  { name: 'granite outcrop', symbol: '#', color: '#8b8c87', walkable: false, role: 'rock' },

  { name: 'shallow water', symbol: '≈', color: '#547f8d', walkable: false, role: null, height: POOL_HEIGHT },
  { name: 'river water', symbol: '≋', color: '#436f80', walkable: false, role: null, height: POOL_HEIGHT },
  { name: 'pasture grass', symbol: "'", color: '#7d9660', walkable: true, role: null },
  { name: 'meadow flowers', symbol: '❀', color: '#8aa165', walkable: true, role: null },
  { name: 'packed dirt', symbol: ',', color: '#8a7053', walkable: true, role: null },
  { name: 'forest loam', symbol: '⁚', color: '#5d4b37', walkable: true, role: null },
  { name: 'scree', symbol: '∴', color: '#918c82', walkable: true, role: null },
  { name: 'marsh', symbol: ';', color: '#5b6a49', walkable: true, role: null },

  { name: 'pine tree', symbol: '♣', color: '#37603f', walkable: false, role: 'tree', height: PINE_HEIGHT },
  { name: 'hazel bush', symbol: '%', color: '#4e7443', walkable: false, role: null, height: BUSH_HEIGHT },
  { name: 'hedge', symbol: '♧', color: '#3f6338', walkable: false, role: 'tree' },

  { name: 'trodden earth path', symbol: '·', color: '#96795c', walkable: true, role: null },
  { name: 'cobbled street', symbol: 'o', color: '#8d8b86', walkable: true, role: null },
  { name: 'flagstone plaza', symbol: '=', color: '#9b9890', walkable: true, role: null },
  { name: 'gravel yard', symbol: ':', color: '#a09a8e', walkable: true, role: null },

  { name: 'dressed granite wall', symbol: '▓', color: '#8d8f8c', walkable: false, role: null },
  { name: 'granite footing', symbol: '▂', color: '#7b7d7a', walkable: true, role: null, shape: 'slabLower' },
  { name: 'slate shingle roof', symbol: '∧', color: '#5f6a72', walkable: false, role: null, shape: 'stairs' },
  { name: 'slate roof ridge', symbol: '⌂', color: '#6c757c', walkable: false, role: null, shape: 'ramp' },
  { name: 'granite stair', symbol: '≜', color: '#94968f', walkable: true, role: null, shape: 'stairs' },
  { name: 'oak plank floor', symbol: '≡', color: '#8c714e', walkable: true, role: null, shape: 'slabLower' },
  { name: 'oak beam', symbol: '│', color: '#6f5739', walkable: false, role: null, shape: 'panel' },
  { name: 'oak shutter window', symbol: '▤', color: '#7d6743', walkable: false, role: null, shape: 'panel' },
  { name: 'iron-strapped oak door', symbol: '▯', color: '#6a5537', walkable: false, role: null, shape: 'panel' },
  { name: 'granite chimney', symbol: '╻', color: '#868880', walkable: false, role: null },

  { name: 'limewashed wattle wall', symbol: '░', color: '#cbc0aa', walkable: false, role: null },
  { name: 'oak cruck frame', symbol: '┃', color: '#6b5439', walkable: false, role: null, shape: 'panel' },
  { name: 'thatch roof', symbol: '∩', color: '#b09a63', walkable: false, role: null, shape: 'stairs' },
  { name: 'thatch roof ridge', symbol: '⌒', color: '#bda86f', walkable: false, role: null, shape: 'ramp' },
  { name: 'rammed earth floor', symbol: '▫', color: '#9a8463', walkable: true, role: null, shape: 'slabLower' },
  { name: 'oak plank door', symbol: '▮', color: '#7a613f', walkable: false, role: null, shape: 'panel' },
  { name: 'small-paned window', symbol: '▦', color: '#a5a99a', walkable: false, role: null, shape: 'panel' },
  { name: 'fieldstone footing', symbol: '▁', color: '#8a8779', walkable: true, role: null, shape: 'slabLower' },
  { name: 'clay chimney', symbol: '╹', color: '#9f7a5c', walkable: false, role: null },

  { name: 'forge coals', symbol: '✱', color: '#b8582c', walkable: false, role: null, shape: 'slabLower', height: KNEE_HEIGHT, light: 5, lightInk: EMBER_INK },
  { name: 'anvil block', symbol: '⏥', color: '#56575b', walkable: false, role: null, height: 1 },
  { name: 'oak bench', symbol: '⌐', color: '#7d6746', walkable: false, role: null, shape: 'slabLower', height: KNEE_HEIGHT },
  { name: 'lantern post', symbol: '⚲', color: '#c2a061', walkable: false, role: null, shape: 'panel', light: 7, lightInk: LANTERN_INK },
  { name: 'well ring', symbol: '◎', color: '#8a8880', walkable: false, role: null, height: 1 },
  { name: 'garden loam', symbol: '⁖', color: '#6a5439', walkable: true, role: null },
  { name: 'firewood stack', symbol: '≣', color: '#7a6142', walkable: false, role: null, height: 1 },
  { name: 'market awning', symbol: '▬', color: '#a26c46', walkable: false, role: null, shape: 'panel' },
] as const satisfies readonly TileEntry[];

export type DefaultTileName = (typeof TILE_CATALOG)[number]['name'];

export function defaultTiles(): TileDef[] {
  return TILE_CATALOG.map(tileFromEntry);
}

export function defaultTileId(name: DefaultTileName): number {
  return TILE_CATALOG.findIndex((entry) => entry.name === name);
}

function tileFromEntry(entry: TileEntry, id: number): TileDef {
  return {
    ...newTileWithId(id),
    ...entry,
    shape: entry.shape ?? 'cube',
    height: entry.height ?? defaultHeightForTile(entry),
    light: entry.light ?? 0,
    lightInk: entry.lightInk ?? DEFAULT_LIGHT_INK,
  };
}

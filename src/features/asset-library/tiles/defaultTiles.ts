import type { TileId } from '@/features/asset-library/asset';
import { DEFAULT_LIGHT_INK } from '@/features/game/light/lightEmission';
import { newTileWithId, type TileDef, type TileRole } from './tileDef';
import { defaultHeightForTile, MIN_BLOCKING_TILE_HEIGHT } from './tileHeight';
import type { TileShapeKind } from './tileShapeKind';

interface TileEntry {
  name: string;
  symbol: string;
  color: string;
  walkable: boolean;
  role: TileRole | null;
  shape?: TileShapeKind;
  height?: number;
  texture?: string;
  light?: number;
  lightInk?: string;
}

const POOL_HEIGHT = MIN_BLOCKING_TILE_HEIGHT;
const WAIST_HEIGHT = MIN_BLOCKING_TILE_HEIGHT;
const OAK_HEIGHT = 2.6;
const PINE_HEIGHT = 3.2;
const BUSH_HEIGHT = 1.6;
const KNEE_HEIGHT = 0.5;
const EMBER_INK = '#ff8a3c';
const LANTERN_INK = '#ffcf7a';

const TILE_CATALOG = [
  { name: 'sea water', symbol: '~', color: '#33546b', walkable: false, role: 'water', height: POOL_HEIGHT, texture: 'stillWater' },
  { name: 'shore sand', symbol: '.', color: '#c9b892', walkable: true, role: 'sand', texture: 'duneSand' },
  { name: 'meadow grass', symbol: '"', color: '#6d8a55', walkable: true, role: 'grass', texture: 'meadowTurf' },
  { name: 'oak tree', symbol: '♠', color: '#41663c', walkable: false, role: 'tree', height: OAK_HEIGHT },
  { name: 'granite outcrop', symbol: '#', color: '#8b8c87', walkable: false, role: 'rock', texture: 'fieldstone' },

  { name: 'shallow water', symbol: '≈', color: '#547f8d', walkable: false, role: 'water', height: POOL_HEIGHT, texture: 'stillWater' },
  { name: 'river water', symbol: '≋', color: '#436f80', walkable: false, role: 'water', height: POOL_HEIGHT, texture: 'stillWater' },
  { name: 'pasture grass', symbol: "'", color: '#7d9660', walkable: true, role: null, texture: 'grassTurf' },
  { name: 'meadow flowers', symbol: '❀', color: '#8aa165', walkable: true, role: null, texture: 'meadowTurf' },
  { name: 'packed dirt', symbol: ',', color: '#8a7053', walkable: true, role: null, texture: 'troddenEarth' },
  { name: 'forest loam', symbol: '⁚', color: '#5d4b37', walkable: true, role: null, texture: 'forestLoam' },
  { name: 'scree', symbol: '∴', color: '#918c82', walkable: true, role: null, texture: 'scree' },
  { name: 'marsh', symbol: ';', color: '#5b6a49', walkable: true, role: null, texture: 'forestLoam' },

  { name: 'pine tree', symbol: '♣', color: '#37603f', walkable: false, role: 'tree', height: PINE_HEIGHT },
  { name: 'hazel bush', symbol: '%', color: '#4e7443', walkable: false, role: null, height: BUSH_HEIGHT },
  { name: 'hedge', symbol: '♧', color: '#3f6338', walkable: false, role: 'tree' },

  { name: 'trodden earth path', symbol: '·', color: '#96795c', walkable: true, role: null, texture: 'troddenEarth' },
  { name: 'cobbled street', symbol: 'o', color: '#8d8b86', walkable: true, role: null, texture: 'cobbles' },
  { name: 'flagstone plaza', symbol: '=', color: '#9b9890', walkable: true, role: null, texture: 'flagstone' },
  { name: 'gravel yard', symbol: ':', color: '#a09a8e', walkable: true, role: null, texture: 'gravel' },

  { name: 'dressed granite wall', symbol: '▓', color: '#8d8f8c', walkable: false, role: null, texture: 'dressedGranite' },
  { name: 'granite footing', symbol: '▂', color: '#7b7d7a', walkable: true, role: null, shape: 'slabLower', texture: 'dressedGranite' },
  { name: 'slate shingle roof', symbol: '∧', color: '#5f6a72', walkable: true, role: null, shape: 'stairs', texture: 'slateShingle' },
  { name: 'slate roof ridge', symbol: '⌂', color: '#6c757c', walkable: true, role: null, shape: 'ramp', texture: 'slateShingle' },
  { name: 'granite stair', symbol: '≜', color: '#94968f', walkable: true, role: null, shape: 'stairs', texture: 'dressedGranite' },
  { name: 'oak plank floor', symbol: '≡', color: '#8c714e', walkable: true, role: null, shape: 'slabLower', texture: 'oakPlank' },
  { name: 'oak beam', symbol: '│', color: '#6f5739', walkable: false, role: null, shape: 'wall', texture: 'oakBeam' },
  { name: 'oak shutter window', symbol: '▤', color: '#7d6743', walkable: false, role: null, shape: 'wall', texture: 'oakBeam' },
  { name: 'iron-strapped oak door', symbol: '▯', color: '#6a5537', walkable: false, role: null, shape: 'wall', texture: 'oakPlank' },
  { name: 'granite chimney', symbol: '╻', color: '#868880', walkable: false, role: null, texture: 'dressedGranite' },

  { name: 'limewashed wattle wall', symbol: '░', color: '#cbc0aa', walkable: false, role: null, texture: 'limewashWattle' },
  { name: 'oak cruck frame', symbol: '┃', color: '#6b5439', walkable: false, role: null, shape: 'wall', texture: 'oakBeam' },
  { name: 'thatch roof', symbol: '∩', color: '#b09a63', walkable: true, role: null, shape: 'stairs', texture: 'thatch' },
  { name: 'thatch roof ridge', symbol: '⌒', color: '#bda86f', walkable: true, role: null, shape: 'ramp', texture: 'thatch' },
  { name: 'rammed earth floor', symbol: '▫', color: '#9a8463', walkable: true, role: null, shape: 'slabLower', texture: 'rammedEarth' },
  { name: 'oak plank door', symbol: '▮', color: '#7a613f', walkable: false, role: null, shape: 'wall', texture: 'oakPlank' },
  { name: 'small-paned window', symbol: '▦', color: '#a5a99a', walkable: false, role: null, shape: 'wall', texture: 'oakBeam' },
  { name: 'fieldstone footing', symbol: '▁', color: '#8a8779', walkable: true, role: null, shape: 'slabLower', texture: 'fieldstone' },
  { name: 'clay chimney', symbol: '╹', color: '#9f7a5c', walkable: false, role: null, texture: 'rammedEarth' },

  { name: 'forge coals', symbol: '✱', color: '#b8582c', walkable: true, role: null, shape: 'slabLower', height: KNEE_HEIGHT, light: 5, lightInk: EMBER_INK, texture: 'forgeCoals' },
  { name: 'anvil block', symbol: '⏥', color: '#56575b', walkable: false, role: null, height: WAIST_HEIGHT, texture: 'rivetedIron' },
  { name: 'oak bench', symbol: '⌐', color: '#7d6746', walkable: true, role: null, shape: 'slabLower', height: KNEE_HEIGHT, texture: 'oakPlank' },
  { name: 'lantern post', symbol: '⚲', color: '#c2a061', walkable: false, role: null, shape: 'wall', light: 7, lightInk: LANTERN_INK, texture: 'oakBeam' },
  { name: 'well ring', symbol: '◎', color: '#8a8880', walkable: false, role: null, height: WAIST_HEIGHT, texture: 'fieldstone' },
  { name: 'garden loam', symbol: '⁖', color: '#6a5439', walkable: true, role: null, texture: 'forestLoam' },
  { name: 'firewood stack', symbol: '≣', color: '#7a6142', walkable: false, role: null, height: WAIST_HEIGHT, texture: 'oakBeam' },
  { name: 'market awning', symbol: '▬', color: '#a26c46', walkable: false, role: null, shape: 'wall', texture: 'oakPlank' },

  { name: 'lake water', symbol: '≀', color: '#3d6a82', walkable: false, role: 'water', height: POOL_HEIGHT, texture: 'stillWater' },
  { name: 'whitewater', symbol: '⁓', color: '#a8c6cf', walkable: false, role: 'water', height: POOL_HEIGHT, texture: 'stillWater' },
  { name: 'snowfield', symbol: '❄', color: '#e6edf2', walkable: true, role: null, texture: 'scree' },
] as const satisfies readonly TileEntry[];

export type DefaultTileName = (typeof TILE_CATALOG)[number]['name'];

export function defaultTiles(): TileDef[] {
  return TILE_CATALOG.map((entry, index) => tileFromEntry(entry, index as TileId));
}

export function defaultTileId(name: DefaultTileName): TileId {
  return TILE_CATALOG.findIndex((entry) => entry.name === name) as TileId;
}

function tileFromEntry(entry: TileEntry, id: TileId): TileDef {
  const { texture, shape, height, light, lightInk, ...fields } = entry;
  return {
    ...newTileWithId(id),
    ...fields,
    shape: shape ?? 'cube',
    textureId: texture ?? null,
    height: height ?? defaultHeightForTile(entry),
    light: light ?? 0,
    lightInk: lightInk ?? DEFAULT_LIGHT_INK,
  };
}

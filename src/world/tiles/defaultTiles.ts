import { newTileWithId, type TileDef, type TileRole } from './tileDef';
import { defaultHeightForTile } from './tileHeight';
import type { CubeFaceArt } from './tileFaceArt';
import {
  brickWallFaceArt,
  cobblestoneFaceArt,
  flagstoneFaceArt,
  rockFaceArt,
  stoneWallFaceArt,
} from './art/tiles/stoneworkTileArt';
import { lavaFaceArt, thatchRoofFaceArt, woodPlanksFaceArt } from './art/tiles/builtTileArt';
import {
  dirtPathFaceArt,
  farmlandFaceArt,
  gravelFaceArt,
  marshFaceArt,
  sandFaceArt,
  snowFaceArt,
} from './art/tiles/groundTileArt';
import {
  bushFaceArt,
  flowersFaceArt,
  grassFaceArt,
  pineTreeFaceArt,
  treeFaceArt,
} from './art/tiles/vegetationTileArt';
import { deepWaterFaceArt, iceFaceArt, waterFaceArt } from './art/tiles/waterTileArt';
import {
  ashFaceArt,
  charredTreeFaceArt,
  hedgeFaceArt,
  scorchedStoneFaceArt,
} from './art/tiles/emberTileArt';

interface TileEntry {
  name: string;
  symbol: string;
  color: string;
  walkable: boolean;
  role: TileRole | null;
  height?: number;
  art: () => CubeFaceArt;
  light?: number;
}

const POOL_HEIGHT = 1;
const TREE_HEIGHT = 2.6;
const PINE_TREE_HEIGHT = 3.2;
const CHARRED_TREE_HEIGHT = 2.4;

const TILE_CATALOG: readonly TileEntry[] = [
  { name: 'water', symbol: '~', color: '#3a6ea5', walkable: false, role: 'water', height: POOL_HEIGHT, art: waterFaceArt },
  { name: 'sand', symbol: '.', color: '#d8c07a', walkable: true, role: 'sand', art: sandFaceArt },
  { name: 'grass', symbol: '"', color: '#4a7b3b', walkable: true, role: 'grass', art: grassFaceArt },
  { name: 'tree', symbol: '♠', color: '#2d6a34', walkable: false, role: 'tree', height: TREE_HEIGHT, art: treeFaceArt },
  { name: 'rock', symbol: '#', color: '#8b8b85', walkable: false, role: 'rock', art: rockFaceArt },
  { name: 'deep water', symbol: '≈', color: '#1c3c69', walkable: false, role: null, height: POOL_HEIGHT, art: deepWaterFaceArt },
  { name: 'ice', symbol: '❄', color: '#b9dbe8', walkable: true, role: null, art: iceFaceArt },
  { name: 'snow', symbol: '*', color: '#f2f6fa', walkable: true, role: null, art: snowFaceArt },
  { name: 'dirt path', symbol: ',', color: '#8a6a45', walkable: true, role: null, art: dirtPathFaceArt },
  { name: 'gravel', symbol: ':', color: '#8d8d88', walkable: true, role: null, art: gravelFaceArt },
  { name: 'marsh', symbol: ';', color: '#55663f', walkable: true, role: null, art: marshFaceArt },
  { name: 'farmland', symbol: 'v', color: '#6d5030', walkable: true, role: null, art: farmlandFaceArt },
  { name: 'flowers', symbol: '❀', color: '#5c8a44', walkable: true, role: null, art: flowersFaceArt },
  { name: 'bush', symbol: '%', color: '#396d33', walkable: false, role: null, art: bushFaceArt },
  { name: 'pine tree', symbol: '♣', color: '#234f36', walkable: false, role: 'tree', height: PINE_TREE_HEIGHT, art: pineTreeFaceArt },
  { name: 'cobblestone', symbol: 'o', color: '#8a8f98', walkable: true, role: null, art: cobblestoneFaceArt },
  { name: 'flagstone', symbol: '=', color: '#9aa0a8', walkable: true, role: null, art: flagstoneFaceArt },
  { name: 'stone wall', symbol: '▓', color: '#7d8189', walkable: false, role: null, art: stoneWallFaceArt },
  { name: 'brick wall', symbol: '█', color: '#a04c3a', walkable: false, role: null, art: brickWallFaceArt },
  { name: 'wood planks', symbol: '≡', color: '#8a6236', walkable: true, role: null, art: woodPlanksFaceArt },
  { name: 'thatch roof', symbol: '∩', color: '#b58f45', walkable: false, role: null, art: thatchRoofFaceArt },
  { name: 'lava', symbol: '^', color: '#e8531f', walkable: false, role: null, height: POOL_HEIGHT, art: lavaFaceArt, light: 6 },
  { name: 'ash', symbol: '∴', color: '#615952', walkable: true, role: null, art: ashFaceArt },
  { name: 'scorched stone', symbol: '▒', color: '#4e4a46', walkable: false, role: null, art: scorchedStoneFaceArt },
  { name: 'hedge', symbol: '♧', color: '#2e5a28', walkable: false, role: 'tree', art: hedgeFaceArt },
  { name: 'charred tree', symbol: '†', color: '#342d28', walkable: false, role: 'tree', height: CHARRED_TREE_HEIGHT, art: charredTreeFaceArt },
];

export function defaultTiles(): TileDef[] {
  return TILE_CATALOG.map(tileFromEntry);
}

function tileFromEntry(entry: TileEntry, id: number): TileDef {
  const { art, height, ...fields } = entry;
  return {
    ...newTileWithId(id),
    ...fields,
    height: height ?? defaultHeightForTile(entry),
    faceArt: art(),
  };
}

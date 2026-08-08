import type { TileDef } from '../../tileDef';
import { storedTileHeight } from '../../tileHeight';

export type BillboardKind = 'conifer' | 'broadleaf' | 'shrub' | 'boulder' | 'bloom';

const CONIFER_STANDS_AT_LEAST = 3;
const BROADLEAF_STANDS_AT_LEAST = 2;
const BLOOM_STANDS = 0.6;
const BOULDER_STANDS_AT_MOST = 1;

export function billboardKindOfTile(tile: TileDef): BillboardKind {
  if (tile.role === 'rock') return 'boulder';
  if (tile.walkable) return 'bloom';
  return treeKindForHeight(storedTileHeight(tile));
}

export function billboardHeightOfTile(tile: TileDef): number {
  const kind = billboardKindOfTile(tile);
  if (kind === 'bloom') return BLOOM_STANDS;
  if (kind === 'boulder') return Math.min(storedTileHeight(tile), BOULDER_STANDS_AT_MOST);
  return storedTileHeight(tile);
}

function treeKindForHeight(height: number): BillboardKind {
  if (height >= CONIFER_STANDS_AT_LEAST) return 'conifer';
  if (height >= BROADLEAF_STANDS_AT_LEAST) return 'broadleaf';
  return 'shrub';
}

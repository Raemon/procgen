import type { CultureId, PieceId } from '@/features/asset-library/asset';
import type { PieceRoleBindings } from './cultureDef';
import { defaultPieceId } from '../pieces/defaultPieces';
import { FURNISHING_PIECE_NAMES } from '../pieces/defaults/furnishingPieces';
import { STONEWOLD_PIECE_NAMES } from '../pieces/defaults/stonewoldPieces';
import { THATCHMERE_PIECE_NAMES } from '../pieces/defaults/thatchmerePieces';
import type { CulturePieceNames } from '../pieces/defaults/culturePieceSet';

import { defaultTileId } from '../tiles/defaultTiles';
import { GABLE_ROOF, HIP_ROOF, type Culture } from './cultureDef';

export const STONEWOLD_CULTURE_ID = 0 as CultureId;
export const THATCHMERE_CULTURE_ID = 1 as CultureId;

export function defaultCultures(): Culture[] {
  return [stonewold(), thatchmere()];
}

function stonewold(): Culture {
  return {
    id: STONEWOLD_CULTURE_ID,
    name: 'stonewold',
    roleBindings: roleBindingsOf(STONEWOLD_PIECE_NAMES),
    wallTileId: defaultTileId('dressed granite wall'),
    trimTileId: defaultTileId('oak beam'),
    roofSlopeTileId: defaultTileId('slate shingle roof'),
    roofRidgeTileId: defaultTileId('slate roof ridge'),
    floorTileId: defaultTileId('oak plank floor'),
    pathTileId: defaultTileId('cobbled street'),
    roofStyle: HIP_ROOF,
    storyLayers: 3,
    windowEvery: 3,
  };
}

function thatchmere(): Culture {
  return {
    id: THATCHMERE_CULTURE_ID,
    name: 'thatchmere',
    roleBindings: roleBindingsOf(THATCHMERE_PIECE_NAMES),
    wallTileId: defaultTileId('limewashed wattle wall'),
    trimTileId: defaultTileId('oak cruck frame'),
    roofSlopeTileId: defaultTileId('thatch roof'),
    roofRidgeTileId: defaultTileId('thatch roof ridge'),
    floorTileId: defaultTileId('rammed earth floor'),
    pathTileId: defaultTileId('trodden earth path'),
    roofStyle: GABLE_ROOF,
    storyLayers: 2,
    windowEvery: 4,
  };
}

function roleBindingsOf(names: CulturePieceNames): PieceRoleBindings {
  return {
    wallSegment: [defaultPieceId(names.wallRun)],
    wallCorner: [defaultPieceId(names.cornerPost)],
    window: [defaultPieceId(names.windowedWall)],
    door: [defaultPieceId(names.doorway)],
    roofEdge: [defaultPieceId(names.roofEave)],
    roofRidge: [defaultPieceId(names.roofRidge)],
    roofGableEnd: [defaultPieceId(names.gableEnd)],
    floor: [defaultPieceId(names.floorSlab)],
    chimney: [defaultPieceId(names.chimney)],
    furnishing: sharedFurnishingIds(),
  };
}

function sharedFurnishingIds(): PieceId[] {
  return Object.values(FURNISHING_PIECE_NAMES).map(defaultPieceId);
}

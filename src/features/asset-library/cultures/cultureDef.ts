import { NO_TILE, type CultureId, type PieceId, type TileId } from '../asset';
import type { PieceRole } from '../pieces/pieceDef';

export const GABLE_ROOF = 0;
export const HIP_ROOF = 1;
export const MIN_STORY_LAYERS = 1;
export const MAX_STORY_LAYERS = 6;
export const MIN_WINDOW_EVERY = 1;
export const MAX_WINDOW_EVERY = 12;

export type PieceRoleBindings = Partial<Record<PieceRole, PieceId[]>>;

export interface Culture {
  id: CultureId;
  name: string;
  roleBindings: PieceRoleBindings;
  wallTileId: TileId;
  trimTileId: TileId;
  roofSlopeTileId: TileId;
  roofRidgeTileId: TileId;
  floorTileId: TileId;
  pathTileId: TileId;
  roofStyle: number;
  storyLayers: number;
  windowEvery: number;
}

export function newCultureWithId(id: CultureId): Culture {
  return {
    id,
    name: `culture ${id}`,
    roleBindings: {},
    ...noTilesChosenYet(),
    roofStyle: GABLE_ROOF,
    storyLayers: 3,
    windowEvery: 3,
  };
}

export function noTilesChosenYet(): Pick<
  Culture,
  'wallTileId' | 'trimTileId' | 'roofSlopeTileId' | 'roofRidgeTileId' | 'floorTileId' | 'pathTileId'
> {
  return {
    wallTileId: NO_TILE,
    trimTileId: NO_TILE,
    roofSlopeTileId: NO_TILE,
    roofRidgeTileId: NO_TILE,
    floorTileId: NO_TILE,
    pathTileId: NO_TILE,
  };
}

export function piecesBoundToRole(culture: Culture, role: PieceRole): readonly PieceId[] {
  return culture.roleBindings[role] ?? [];
}

export function wallLayersOf(culture: Culture, stories: number): number {
  return Math.max(MIN_STORY_LAYERS, culture.storyLayers) * Math.max(1, stories);
}

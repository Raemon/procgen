import type { PieceRole } from '../pieces/pieceDef';

export const GABLE_ROOF = 0;
export const HIP_ROOF = 1;
export const MIN_STORY_LAYERS = 1;
export const MAX_STORY_LAYERS = 6;
export const MIN_WINDOW_EVERY = 1;
export const MAX_WINDOW_EVERY = 12;

export interface Culture {
  id: number;
  name: string;
  roleBindings: Partial<Record<PieceRole, number[]>>;
  wallTileId: number;
  trimTileId: number;
  roofSlopeTileId: number;
  roofRidgeTileId: number;
  floorTileId: number;
  pathTileId: number;
  roofStyle: number;
  storyLayers: number;
  windowEvery: number;
}

export function newCultureWithId(id: number): Culture {
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
    wallTileId: -1,
    trimTileId: -1,
    roofSlopeTileId: -1,
    roofRidgeTileId: -1,
    floorTileId: -1,
    pathTileId: -1,
  };
}

export function piecesBoundToRole(culture: Culture, role: PieceRole): readonly number[] {
  return culture.roleBindings[role] ?? [];
}

export function wallLayersOf(culture: Culture, stories: number): number {
  return Math.max(MIN_STORY_LAYERS, culture.storyLayers) * Math.max(1, stories);
}

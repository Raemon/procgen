import type { Culture } from './cultureDef';

export type CultureTileField =
  | 'wallTileId'
  | 'trimTileId'
  | 'roofSlopeTileId'
  | 'roofRidgeTileId'
  | 'floorTileId'
  | 'pathTileId';

export interface CultureTileSlot {
  field: CultureTileField;
  param: string;
  label: string;
  builds: string;
}

export const CULTURE_TILE_SLOTS: readonly CultureTileSlot[] = [
  {
    field: 'wallTileId',
    param: 'wall_tile',
    label: 'wall',
    builds: 'Every wall column of every story, wherever no wall piece is bound.',
  },
  {
    field: 'trimTileId',
    param: 'trim_tile',
    label: 'trim',
    builds: 'Corners, doorframes and chimneys — the edges that read as carpentry.',
  },
  {
    field: 'roofSlopeTileId',
    param: 'roof_slope_tile',
    label: 'roof slope',
    builds: 'The sloping faces of the roof, gable or hip alike.',
  },
  {
    field: 'roofRidgeTileId',
    param: 'roof_ridge_tile',
    label: 'roof ridge',
    builds: 'The line along the top of the roof where the two slopes meet.',
  },
  {
    field: 'floorTileId',
    param: 'floor_tile',
    label: 'floor',
    builds: 'The ground layer under every interior cell of the building.',
  },
  {
    field: 'pathTileId',
    param: 'path_tile',
    label: 'path',
    builds: 'The yard and the paths the assembler lays around the building.',
  },
];

export function tileChosenForSlot(culture: Culture, slot: CultureTileSlot): number {
  return culture[slot.field];
}

import { EMPTY_VOXEL } from '../../assets/pieces/pieceDef';
import { packedVoxel } from '../structureOverlay/packedVoxel';
import type { PaintVoxel } from './buildingSpec';

export const FLOOR_LAYER = 0;
export const FIRST_WALL_LAYER = 1;
export const DOOR_OPENING_LAYERS = 2;

export function paintTile(
  paint: PaintVoxel,
  worldX: number,
  worldY: number,
  layer: number,
  tileId: number,
  facing: number,
): void {
  if (tileId === EMPTY_VOXEL) return;
  paint(worldX, worldY, layer, packedVoxel(tileId, facing));
}

export function paintWallColumn(
  paint: PaintVoxel,
  worldX: number,
  worldY: number,
  wallLayers: number,
  tileId: number,
  facing: number,
): void {
  for (let layer = FIRST_WALL_LAYER; layer <= wallLayers; layer++) {
    paintTile(paint, worldX, worldY, layer, tileId, facing);
  }
}

export function paintDoorColumn(
  paint: PaintVoxel,
  worldX: number,
  worldY: number,
  wallLayers: number,
  tileId: number,
  facing: number,
): void {
  for (let layer = FIRST_WALL_LAYER + DOOR_OPENING_LAYERS; layer <= wallLayers; layer++) {
    paintTile(paint, worldX, worldY, layer, tileId, facing);
  }
}

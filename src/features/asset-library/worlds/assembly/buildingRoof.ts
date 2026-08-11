import { GABLE_ROOF } from '@/features/asset-library/cultures/cultureDef';
import type { RoomBox } from './buildingMassing';
import {
  FACING_EAST,
  FACING_NORTH,
  FACING_SOUTH,
  FACING_WEST,
  oppositeFacing,
} from './buildingSpec';

export interface RoofVoxel {
  x: number;
  y: number;
  layer: number;
  facing: number;
  isRidge: boolean;
}

export function roofVoxelsOf(box: RoomBox, roofStyle: number, baseLayer: number): RoofVoxel[] {
  const voxels: RoofVoxel[] = [];
  for (let y = box.y; y < box.y + box.depth; y++) {
    for (let x = box.x; x < box.x + box.width; x++) {
      voxels.push(roofVoxelAt(box, roofStyle, baseLayer, x, y));
    }
  }
  return voxels;
}

export function roofBaseLayerOf(wallLayers: number): number {
  return wallLayers + 1;
}

function roofVoxelAt(
  box: RoomBox,
  roofStyle: number,
  baseLayer: number,
  x: number,
  y: number,
): RoofVoxel {
  const slopes = roofStyle === GABLE_ROOF ? gableSlopes(box, x, y) : hipSlopes(box, x, y);
  const nearest = slopes.reduce((best, slope) => (slope.rise < best.rise ? slope : best));
  const peak = Math.min(...slopes.map((slope) => maxRiseOf(slope)));
  return {
    x,
    y,
    layer: baseLayer + nearest.rise,
    facing: risingStepFacingOf(nearest),
    isRidge: nearest.rise >= peak,
  };
}

function risingStepFacingOf(slope: RoofSlope): number {
  return oppositeFacing(slope.facing);
}

interface RoofSlope {
  rise: number;
  facing: number;
  span: number;
}

function gableSlopes(box: RoomBox, x: number, y: number): RoofSlope[] {
  const alongWidth = box.width >= box.depth;
  return alongWidth ? northSouthSlopes(box, y) : eastWestSlopes(box, x);
}

function hipSlopes(box: RoomBox, x: number, y: number): RoofSlope[] {
  return [...northSouthSlopes(box, y), ...eastWestSlopes(box, x)];
}

function northSouthSlopes(box: RoomBox, y: number): RoofSlope[] {
  return [
    { rise: y - box.y, facing: FACING_NORTH, span: box.depth },
    { rise: box.y + box.depth - 1 - y, facing: FACING_SOUTH, span: box.depth },
  ];
}

function eastWestSlopes(box: RoomBox, x: number): RoofSlope[] {
  return [
    { rise: x - box.x, facing: FACING_WEST, span: box.width },
    { rise: box.x + box.width - 1 - x, facing: FACING_EAST, span: box.width },
  ];
}

function maxRiseOf(slope: RoofSlope): number {
  return Math.floor((slope.span - 1) / 2);
}

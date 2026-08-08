import type { Marker, WorldSampler } from '../../../procgen/worldSampler';
import { withTransparency } from '../../../assets/tiles/inkColor';
import { WALKABLE_TILE_HEIGHT } from '../../../assets/tiles/tileHeight';
import { DEFAULT_TILE_SHAPE } from '../../../assets/tiles/tileShapeKind';
import { NO_EXTRA_MARKERS, type MarkerSource } from '../markerSource';
import type { TilePlacement } from './tilePlacements';

export interface MarkerPlacementsByShape {
  pins: TilePlacement[];
  billboards: TilePlacement[];
  standingFixtures: TilePlacement[];
}

export function markerPlacementsForRect(
  sampler: WorldSampler,
  minX: number,
  minY: number,
  width: number,
  height: number,
  extraMarkers: MarkerSource = NO_EXTRA_MARKERS,
): MarkerPlacementsByShape {
  const shapes: MarkerPlacementsByShape = { pins: [], billboards: [], standingFixtures: [] };
  for (const marker of markersInRect(sampler, minX, minY, width, height, extraMarkers)) {
    shapes[shapeBucketOf(marker)].push(placementForMarker(marker, sampler.elevationAt(marker.x, marker.y)));
  }
  return shapes;
}

function shapeBucketOf(marker: Marker): keyof MarkerPlacementsByShape {
  if (marker.standingHeight) return 'standingFixtures';
  return marker.billboardHeight ? 'billboards' : 'pins';
}

function markersInRect(
  sampler: WorldSampler,
  minX: number,
  minY: number,
  width: number,
  height: number,
  extraMarkers: MarkerSource,
): Marker[] {
  const [maxX, maxY] = [minX + width - 1, minY + height - 1];
  return [...sampler.markersIn(minX, minY, maxX, maxY), ...extraMarkers.markersIn(minX, minY, maxX, maxY)];
}

function placementForMarker(marker: Marker, elevation: number): TilePlacement {
  return {
    x: marker.x,
    y: marker.y,
    elevation,
    height: marker.standingHeight ?? marker.billboardHeight ?? WALKABLE_TILE_HEIGHT,
    baseColor: withTransparency(marker.color, marker.seeThroughUnpaintedArt === true),
    shade: 1,
    faceArt: marker.faceArt,
    textureId: null,
    glow: 0,
    sunkenAsWater: false,
    shape: DEFAULT_TILE_SHAPE,
    facing: 0,
  };
}

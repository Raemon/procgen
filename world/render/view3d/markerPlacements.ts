import type { Marker, WorldSampler } from '../../../procgen/worldSampler';
import { WALKABLE_TILE_HEIGHT } from '../../../assets/tiles/tileHeight';
import { NO_EXTRA_MARKERS, type MarkerSource } from '../markerSource';
import type { TilePlacement } from './tilePlacements';

export interface MarkerPlacementsByShape {
  pins: TilePlacement[];
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
  const shapes: MarkerPlacementsByShape = { pins: [], standingFixtures: [] };
  for (const marker of markersInRect(sampler, minX, minY, width, height, extraMarkers)) {
    const placement = placementForMarker(marker, sampler.elevationAt(marker.x, marker.y));
    (marker.standingHeight ? shapes.standingFixtures : shapes.pins).push(placement);
  }
  return shapes;
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
    height: marker.standingHeight ?? WALKABLE_TILE_HEIGHT,
    baseColor: marker.color,
    shade: 1,
    faceArt: marker.faceArt,
    glow: 0,
    sunkenAsWater: false,
  };
}

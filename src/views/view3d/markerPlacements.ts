import type { WorldSampler } from '../../procgen/worldSampler';
import type { TilePlacement } from './tilePlacements';

export function markerPlacementsForRect(
  sampler: WorldSampler,
  minX: number,
  minY: number,
  width: number,
  height: number,
): TilePlacement[] {
  return sampler
    .markersIn(minX, minY, minX + width - 1, minY + height - 1)
    .map((marker) => ({
      x: marker.x,
      y: marker.y,
      elevation: sampler.elevationAt(marker.x, marker.y),
      baseColor: marker.color,
      shade: 1,
      faceArt: marker.faceArt,
      glow: 0,
      sunkenAsWater: false,
    }));
}

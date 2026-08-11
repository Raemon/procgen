import type { Marker } from '@/features/asset-library/worlds/worldSampler';

export interface MarkerSource {
  markersIn(minX: number, minY: number, maxX: number, maxY: number): Marker[];
}

export const NO_EXTRA_MARKERS: MarkerSource = { markersIn: () => [] };

import type { CubeFaceArt } from '../../../assets/tiles/tileFaceArt';
import type { FacedPlacement } from './culling/foldRareFaceVariants';
import type { TilePlacement } from './tilePlacements';

export interface PlacementGroup {
  art: CubeFaceArt | null;
  baseColor: string;
  glow: number;
  faces: number;
  placements: TilePlacement[];
}

type GroupsBySurface = Map<CubeFaceArt | string, Map<number, PlacementGroup>>;

export function groupsOfLikeSurfaceAndFaces(faced: readonly FacedPlacement[]): PlacementGroup[] {
  const bySurface: GroupsBySurface = new Map();
  for (const one of faced) addToGroup(bySurface, one.placement, one.faces);
  return [...bySurface.values()].flatMap((byFaces) => [...byFaces.values()]);
}

function addToGroup(bySurface: GroupsBySurface, placement: TilePlacement, faces: number): void {
  const byFaces = groupsSharingSurface(bySurface, placement);
  const group = byFaces.get(faces) ?? {
    art: placement.faceArt,
    baseColor: placement.baseColor,
    glow: placement.glow,
    faces,
    placements: [],
  };
  byFaces.set(faces, group);
  group.placements.push(placement);
}

function groupsSharingSurface(
  bySurface: GroupsBySurface,
  placement: TilePlacement,
): Map<number, PlacementGroup> {
  const key = placement.faceArt ?? flatSurfaceKey(placement);
  const byFaces = bySurface.get(key) ?? new Map<number, PlacementGroup>();
  bySurface.set(key, byFaces);
  return byFaces;
}

function flatSurfaceKey(placement: TilePlacement): string {
  return placement.glow > 0 ? `glowing:${placement.baseColor}:${placement.glow}` : 'unlit';
}

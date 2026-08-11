import type { CubeFaceArt } from '@/features/asset-library/tiles/tileFaceArt';
import type { FacedPlacement } from './culling/foldRareFaceVariants';
import type { TilePlacement } from './tilePlacements';

export interface PlacementGroup {
  art: CubeFaceArt | null;
  textureId: string | null;
  baseColor: string;
  glow: number;
  faces: number;
  placements: TilePlacement[];
}

type GroupsBySurface = Map<CubeFaceArt | string, Map<string, PlacementGroup>>;

export function groupsOfLikeSurfaceAndFaces(faced: readonly FacedPlacement[]): PlacementGroup[] {
  const bySurface: GroupsBySurface = new Map();
  for (const one of faced) addToGroup(bySurface, one.placement, one.faces);
  return [...bySurface.values()].flatMap((bySolid) => [...bySolid.values()]);
}

function addToGroup(bySurface: GroupsBySurface, placement: TilePlacement, faces: number): void {
  const bySolid = groupsSharingSurface(bySurface, placement);
  const key = solidKey(placement, faces);
  const group = bySolid.get(key) ?? {
    art: placement.faceArt,
    textureId: placement.textureId,
    baseColor: placement.baseColor,
    glow: placement.glow,
    faces,
    placements: [],
  };
  bySolid.set(key, group);
  group.placements.push(placement);
}

function solidKey(placement: TilePlacement, faces: number): string {
  return `${faces}:${placement.shape}:${placement.facing}`;
}

function groupsSharingSurface(
  bySurface: GroupsBySurface,
  placement: TilePlacement,
): Map<string, PlacementGroup> {
  const key = placement.faceArt ?? texturedSurfaceKey(placement) ?? flatSurfaceKey(placement);
  const bySolid = bySurface.get(key) ?? new Map<string, PlacementGroup>();
  bySurface.set(key, bySolid);
  return bySolid;
}

function texturedSurfaceKey(placement: TilePlacement): string | null {
  return placement.textureId === null ? null : `png:${placement.textureId}:${placement.glow}`;
}

function flatSurfaceKey(placement: TilePlacement): string {
  return placement.glow > 0 ? `glowing:${placement.baseColor}:${placement.glow}` : 'unlit';
}

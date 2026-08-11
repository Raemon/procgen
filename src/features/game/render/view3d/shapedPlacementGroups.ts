import type { TileShapeKind } from '@/features/asset-library/tiles/tileShapeKind';
import type { TilePlacement } from './tilePlacements';

export interface ShapedPlacementGroup {
  shape: TileShapeKind;
  facing: number;
  placements: TilePlacement[];
}

export function groupedByShapeAndFacing(
  placements: readonly TilePlacement[],
): ShapedPlacementGroup[] {
  const groups = new Map<string, ShapedPlacementGroup>();
  for (const placement of placements) groupFor(groups, placement).placements.push(placement);
  return [...groups.values()];
}

function groupFor(
  groups: Map<string, ShapedPlacementGroup>,
  placement: TilePlacement,
): ShapedPlacementGroup {
  const key = `${placement.shape}:${placement.facing}`;
  const group = groups.get(key) ?? {
    shape: placement.shape,
    facing: placement.facing,
    placements: [],
  };
  groups.set(key, group);
  return group;
}

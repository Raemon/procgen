import type { TilePlacement } from '../tilePlacements';
import type { TileShape } from '../tileShapes';
import { ChunkOccluderField } from './chunkOccluderField';
import type { OccluderWindow } from './chunkSurroundings';
import { placementSealsFaces } from './placementSealsFaces';

export interface ShapedPlacements {
  placements: readonly TilePlacement[];
  shape: TileShape;
}

export function occluderFieldOfPlacements(
  window: OccluderWindow,
  shapedPlacements: readonly ShapedPlacements[],
): ChunkOccluderField {
  const field = new ChunkOccluderField(window.originX, window.originY, window.span);
  for (const { placements, shape } of shapedPlacements) {
    if (shape.occluderBoxOf) addSealingPlacements(field, placements, shape.occluderBoxOf);
  }
  return field;
}

function addSealingPlacements(
  field: ChunkOccluderField,
  placements: readonly TilePlacement[],
  boxOf: NonNullable<TileShape['occluderBoxOf']>,
): void {
  for (const placement of placements) {
    if (placementSealsFaces(placement)) field.addOccluder(placement.x, placement.y, boxOf(placement));
  }
}

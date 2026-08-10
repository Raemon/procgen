import type { VillagePlot } from './villageLayout';

export type GroundHeightAt = (x: number, y: number) => number | null;

export const BUILD_ABOVE_LABEL = 'build above';

export function plotStandsOnGround(
  groundAt: GroundHeightAt | null,
  plot: VillagePlot,
  buildAbove: number,
): boolean {
  if (!groundAt) return true;
  return plotCorners(plot).every((corner) => (groundAt(corner.x, corner.y) ?? 0) > buildAbove);
}

function plotCorners(plot: VillagePlot): Array<{ x: number; y: number }> {
  const right = plot.rect.x + plot.rect.width - 1;
  const bottom = plot.rect.y + plot.rect.depth - 1;
  return [
    { x: plot.rect.x, y: plot.rect.y },
    { x: right, y: plot.rect.y },
    { x: plot.rect.x, y: bottom },
    { x: right, y: bottom },
  ];
}

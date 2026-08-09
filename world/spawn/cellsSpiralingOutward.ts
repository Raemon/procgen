import type { CellPoint } from '../cellPoint';

export function* cellsSpiralingOutward(
  centerX: number,
  centerY: number,
  maxRadius: number,
): Generator<CellPoint> {
  for (let radius = 0; radius <= maxRadius; radius++) {
    yield* cellsOnRing(centerX, centerY, radius);
  }
}

function* cellsOnRing(centerX: number, centerY: number, radius: number): Generator<CellPoint> {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue;
      yield { x: centerX + dx, y: centerY + dy };
    }
  }
}

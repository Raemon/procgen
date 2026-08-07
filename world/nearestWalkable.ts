export interface CellPoint {
  x: number;
  y: number;
}

export function nearestWalkable(
  startX: number,
  startY: number,
  maxRadius: number,
  isWalkableAt: (x: number, y: number) => boolean,
): CellPoint | null {
  for (let radius = 0; radius <= maxRadius; radius++) {
    const found = firstWalkableOnRing(startX, startY, radius, isWalkableAt);
    if (found) return found;
  }
  return null;
}

function firstWalkableOnRing(
  centerX: number,
  centerY: number,
  radius: number,
  isWalkableAt: (x: number, y: number) => boolean,
): CellPoint | null {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue;
      const x = centerX + dx;
      const y = centerY + dy;
      if (isWalkableAt(x, y)) return { x, y };
    }
  }
  return null;
}

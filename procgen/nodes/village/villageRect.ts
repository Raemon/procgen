export interface VillageRect {
  x: number;
  y: number;
  width: number;
  depth: number;
}

export function rectContains(rect: VillageRect, x: number, y: number): boolean {
  return x >= rect.x && y >= rect.y && x < rect.x + rect.width && y < rect.y + rect.depth;
}

export function rectsOverlap(a: VillageRect, b: VillageRect): boolean {
  return (
    a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.depth && b.y < a.y + a.depth
  );
}

export function rectFromBounds(
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
): VillageRect {
  return { x: minX, y: minY, width: maxX - minX + 1, depth: maxY - minY + 1 };
}

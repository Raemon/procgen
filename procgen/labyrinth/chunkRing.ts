export interface ChunkCoord {
  x: number;
  y: number;
}

export function ringOf(cx: number, cy: number): number {
  return Math.max(Math.abs(cx), Math.abs(cy));
}

export function perimeterCount(ring: number): number {
  return ring === 0 ? 1 : 8 * ring;
}

export function chunkAtPerimeter(ring: number, index: number): ChunkCoord {
  if (ring === 0) return { x: 0, y: 0 };
  const count = perimeterCount(ring);
  const i = ((index % count) + count) % count;
  if (i < ring) return { x: ring, y: i };
  if (i < 3 * ring) return { x: ring - (i - ring), y: ring };
  if (i < 5 * ring) return { x: -ring, y: ring - (i - 3 * ring) };
  if (i < 7 * ring) return { x: -ring + (i - 5 * ring), y: -ring };
  return { x: ring, y: -ring + (i - 7 * ring) };
}

export function perimeterIndexOf(cx: number, cy: number): number {
  const ring = ringOf(cx, cy);
  if (ring === 0) return 0;
  if (cx === ring && cy >= 0 && cy < ring) return cy;
  if (cy === ring) return ring + (ring - cx);
  if (cx === -ring) return 3 * ring + (ring - cy);
  if (cy === -ring) return 5 * ring + (cx + ring);
  return 7 * ring + (cy + ring);
}

export function perimeterAngleOf(cx: number, cy: number): number {
  const ring = ringOf(cx, cy);
  return (perimeterIndexOf(cx, cy) / perimeterCount(ring)) * 2 * Math.PI;
}

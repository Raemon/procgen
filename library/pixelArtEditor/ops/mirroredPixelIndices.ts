export function mirroredPixelIndices(
  index: number,
  size: number,
  mirrorX: boolean,
  mirrorY: boolean,
): number[] {
  const row = Math.floor(index / size);
  const col = index % size;
  const rows = mirrorY ? [row, size - 1 - row] : [row];
  const cols = mirrorX ? [col, size - 1 - col] : [col];
  const indices = new Set<number>();
  for (const r of rows) for (const c of cols) indices.add(r * size + c);
  return [...indices];
}

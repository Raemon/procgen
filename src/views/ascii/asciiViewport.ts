export interface AsciiViewport {
  originX: number;
  originY: number;
  columns: number;
  rows: number;
}

export function viewportCenteredOn(
  centerX: number,
  centerY: number,
  columns: number,
  rows: number,
): AsciiViewport {
  return {
    originX: centerX - Math.floor(columns / 2),
    originY: centerY - Math.floor(rows / 2),
    columns,
    rows,
  };
}

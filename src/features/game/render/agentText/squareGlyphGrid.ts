import {
  ASCII_GLYPH_CELL_CLASSES,
  type AsciiGlyphPaint,
} from './asciiGlyphPaint';

export function squareGlyphGrid(
  lines: string[],
  paint: ((glyph: string, row: number, column: number) => AsciiGlyphPaint | null) | null,
  glyphPaints?: Map<string, AsciiGlyphPaint>,
): HTMLElement[] {
  const cells: HTMLElement[] = [];
  lines.forEach((line, row) => {
    const glyphs = [...line];
    glyphs.forEach((glyph, column) => {
      cells.push(glyphCell(glyph, paint?.(glyph, row, column) ?? null, glyphPaints));
    });
  });
  return cells;
}

export function sizeSquareGlyphGrid(grid: HTMLElement, columns: number): void {
  grid.style.gridTemplateColumns = columns > 0 ? `repeat(${columns}, 1em)` : '';
  grid.style.gridAutoRows = columns > 0 ? '1em' : '';
}

function glyphCell(
  glyph: string,
  paint: AsciiGlyphPaint | null,
  glyphPaints?: Map<string, AsciiGlyphPaint>,
): HTMLElement {
  const cell = document.createElement('span');
  cell.className = ASCII_GLYPH_CELL_CLASSES;
  cell.textContent = glyph;
  if (paint) {
    cell.style.color = paint.color;
    if (paint.opacity !== 1) cell.style.opacity = String(paint.opacity);
    if (glyphPaints && !glyphPaints.has(glyph)) glyphPaints.set(glyph, paint);
  }
  return cell;
}

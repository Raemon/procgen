const PROBE_TEXT = 'M'.repeat(64);

export interface GlyphCellSize {
  width: number;
  height: number;
}

export function squareGlyphCells(grid: HTMLElement): GlyphCellSize | null {
  const side = parseFloat(getComputedStyle(grid).fontSize);
  const glyphWidth = characterWidthOf(grid);
  if (!(side > 0) || !(glyphWidth > 0) || glyphWidth > side) return null;
  const gap = side - glyphWidth;
  grid.style.lineHeight = `${side}px`;
  grid.style.letterSpacing = `${gap}px`;
  grid.style.paddingLeft = `${gap / 2}px`;
  return { width: side, height: side };
}

function characterWidthOf(text: HTMLElement): number {
  const probe = document.createElement('span');
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style.whiteSpace = 'pre';
  probe.style.letterSpacing = '0';
  probe.textContent = PROBE_TEXT;
  text.appendChild(probe);
  const width = probe.getBoundingClientRect().width / PROBE_TEXT.length;
  probe.remove();
  return width;
}

export const WALKABLE_GLYPH_OPACITY = 0.35;

export const ASCII_GLYPH_GRID_CLASSES = 'm-0 grid';
export const ASCII_GLYPH_CELL_CLASSES =
  'pointer-events-none flex h-[1em] w-[1em] items-center justify-center';

export interface AsciiGlyphPaint {
  color: string;
  opacity: number;
}

export function asciiGlyphPaint(color: string, walkable: boolean | null): AsciiGlyphPaint {
  return { color, opacity: walkable === true ? WALKABLE_GLYPH_OPACITY : 1 };
}

export const REMEMBERED_GLYPH_SHADE = 0.25;

export function dimmedToMemory(paint: AsciiGlyphPaint): AsciiGlyphPaint {
  return { ...paint, opacity: paint.opacity * REMEMBERED_GLYPH_SHADE };
}

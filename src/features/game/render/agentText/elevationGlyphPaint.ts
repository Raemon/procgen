import type { AsciiGlyphPaint } from './asciiGlyphPaint';

export const ELEVATION_INK = '#d1fae5';
export const LOWEST_ELEVATION_OPACITY = 0.25;
export const HIGHEST_ELEVATION_OPACITY = 1;

export function elevationLevelOfDigit(glyph: string): number | null {
  if (!/^[0-9a-z]$/.test(glyph)) return null;
  return parseInt(glyph, 36);
}

export function elevationOpacity(level: number, lowest: number, highest: number): number {
  if (highest <= lowest) return HIGHEST_ELEVATION_OPACITY;
  const share = (level - lowest) / (highest - lowest);
  return LOWEST_ELEVATION_OPACITY + share * (HIGHEST_ELEVATION_OPACITY - LOWEST_ELEVATION_OPACITY);
}

export function elevationGlyphPaint(lines: string[]): (glyph: string) => AsciiGlyphPaint | null {
  const levels = lines.flatMap((line) => [...line].map(elevationLevelOfDigit)).filter(isLevel);
  if (levels.length === 0) return () => null;
  const lowest = Math.min(...levels);
  const highest = Math.max(...levels);
  return (glyph) => {
    const level = elevationLevelOfDigit(glyph);
    if (level === null) return null;
    return { color: ELEVATION_INK, opacity: elevationOpacity(level, lowest, highest) };
  };
}

function isLevel(level: number | null): level is number {
  return level !== null;
}

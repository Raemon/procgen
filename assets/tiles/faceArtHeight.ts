import { opaqueInk } from './inkColor';

export const FLAT_HEIGHT_INK = '#808080';
const FLAT_HEIGHT = heightOfInk(FLAT_HEIGHT_INK);
export const HEIGHT_INK_STEPS = [0, 0.25, FLAT_HEIGHT, 0.75, 1].map(heightInk);

export function heightInk(unit: number): string {
  const byte = Math.round(clampUnitHeight(unit) * 255)
    .toString(16)
    .padStart(2, '0');
  return `#${byte}${byte}${byte}`;
}

export function heightOfInk(ink: string | null | undefined): number {
  if (!ink) return FLAT_HEIGHT;
  const packed = Number.parseInt(opaqueInk(ink).slice(1), 16);
  if (!Number.isFinite(packed)) return FLAT_HEIGHT;
  return (((packed >> 16) & 255) + ((packed >> 8) & 255) + (packed & 255)) / (3 * 255);
}

export function isFlatHeightField(pixels: readonly (string | null)[]): boolean {
  return pixels.every((pixel) => pixel === null || heightOfInk(pixel) === FLAT_HEIGHT);
}

function clampUnitHeight(unit: number): number {
  return unit < 0 ? 0 : unit > 1 ? 1 : unit;
}

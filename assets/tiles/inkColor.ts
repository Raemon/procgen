export const TRANSPARENT_INK = '#00000000';

const WITH_ALPHA_LENGTH = 9;
const TRANSPARENT_ALPHA = '00';

export function isTransparentInk(ink: string): boolean {
  return ink.length === WITH_ALPHA_LENGTH && ink.slice(7).toLowerCase() === TRANSPARENT_ALPHA;
}

export function unpaintedInk(baseColor: string): string | null {
  return isTransparentInk(baseColor) ? null : baseColor;
}

export function opaqueInk(ink: string): string {
  return ink.length === WITH_ALPHA_LENGTH ? ink.slice(0, 7) : ink;
}

export function withTransparency(ink: string, transparent: boolean): string {
  return transparent ? `${opaqueInk(ink)}${TRANSPARENT_ALPHA}` : opaqueInk(ink);
}

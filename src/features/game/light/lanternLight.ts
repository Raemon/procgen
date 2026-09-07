import { lightSourceAt, type LightSource } from './lightEmission';

export const LANTERN_LIGHT_RADIUS = 7;

export function lanternLightSource(
  x: number,
  y: number,
  elevation: number,
  ink: number,
): LightSource {
  return lightSourceAt(
    { light: LANTERN_LIGHT_RADIUS, lightInk: lanternLightInk(ink) },
    x,
    y,
    elevation,
  );
}

export function lanternLightInk(ink: number): string {
  return `#${(ink & 0xffffff).toString(16).padStart(6, '0')}`;
}

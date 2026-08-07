export const MAX_LIGHT_RADIUS = 24;
export const DEFAULT_LIGHT_INK = '#ffb14a';

export interface LightEmitter {
  light: number;
  lightInk: string;
}

export interface LightSource {
  x: number;
  y: number;
  elevation: number;
  radius: number;
  ink: string;
}

export function clampLightRadius(radius: unknown): number {
  if (typeof radius !== 'number' || !Number.isFinite(radius)) return 0;
  return Math.max(0, Math.min(MAX_LIGHT_RADIUS, radius));
}

export function emitsLight(emitter: LightEmitter | undefined | null): boolean {
  return emitter !== undefined && emitter !== null && clampLightRadius(emitter.light) > 0;
}

export function lightSourceAt(
  emitter: LightEmitter,
  x: number,
  y: number,
  elevation: number,
): LightSource {
  return { x, y, elevation, radius: clampLightRadius(emitter.light), ink: emitter.lightInk };
}

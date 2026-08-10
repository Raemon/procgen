import type { Rgb } from './materialSynth';

export function shaded(base: Rgb, brightness: number): Rgb {
  return [clamp255(base[0] * brightness), clamp255(base[1] * brightness), clamp255(base[2] * brightness)];
}

export function mixed(a: Rgb, b: Rgb, t: number): Rgb {
  return [
    clamp255(a[0] + (b[0] - a[0]) * t),
    clamp255(a[1] + (b[1] - a[1]) * t),
    clamp255(a[2] + (b[2] - a[2]) * t),
  ];
}

function clamp255(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

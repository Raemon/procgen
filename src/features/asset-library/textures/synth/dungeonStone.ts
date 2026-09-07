import type { Rgb } from '../materialSynth';

const SEAM_SHADE = 0.62;

export interface TiledStone {
  relief: number;
  id: number;
}

export function hash21(x: number, y: number): number {
  const px = fract(x * 123.34);
  const py = fract(y * 456.21);
  const spread = px * (px + 45.32) + py * (py + 45.32);
  return fract((px + spread) * (py + spread));
}

export function vnoise(x: number, y: number, period: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = smoothFraction(x - ix);
  const fy = smoothFraction(y - iy);
  const a = hash21(wrap(ix, period), wrap(iy, period));
  const b = hash21(wrap(ix + 1, period), wrap(iy, period));
  const c = hash21(wrap(ix, period), wrap(iy + 1, period));
  const d = hash21(wrap(ix + 1, period), wrap(iy + 1, period));
  return mix(mix(a, b, fx), mix(c, d, fx), fy);
}

export function tiledStone(x: number, y: number, size: number, grout: number): TiledStone {
  const px = x / size;
  const py = y / size;
  const id = hash21(wrap(Math.floor(px), 1 / size) + 3, wrap(Math.floor(py), 1 / size) + 5);
  return { relief: smoothstep(0, grout, edgeDistance(fract(px), fract(py)) * size), id };
}

export function runningBondBrick(x: number, y: number): TiledStone {
  const course = Math.floor(y * 2);
  const px = x + (course % 2) * 0.5;
  const py = y * 2;
  const qx = fract(px);
  const qy = fract(py);
  const mortar = Math.min(Math.min(qx, 1 - qx), Math.min(qy, 1 - qy) * 0.5);
  return {
    relief: smoothstep(0, 0.035, mortar) + 0.06 * vnoise(x * 14, y * 14, 14) + 0.03 * vnoise(x * 47, y * 47, 47),
    id: hash21(3, wrap(course, 2) + 5),
  };
}

export function stoneShade(x: number, y: number, size: number, grout: number): number {
  const { relief, id } = tiledStone(x, y, size, grout);
  return (0.82 + 0.3 * id) * (0.88 + 0.24 * vnoise(x * 9, y * 9, 9)) * mix(SEAM_SHADE, 1, relief);
}

export function brickShade(x: number, y: number): number {
  const { relief, id } = runningBondBrick(x, y);
  return (0.78 + 0.36 * id) * mix(0.55, 1, relief) * (0.92 + 0.16 * vnoise(x * 33, y * 33, 33));
}

export function shadedInk(shade: number, ceiling: number): Rgb {
  const level = Math.round(clamp(shade / ceiling, 0, 1) * 255);
  return [level, level, level];
}

export function edgeDistance(x: number, y: number): number {
  return Math.min(x, 1 - x, y, 1 - y);
}

export function smoothstep(from: number, to: number, at: number): number {
  return smoothFraction(clamp((at - from) / (to - from), 0, 1));
}

export function mix(from: number, to: number, at: number): number {
  return from + (to - from) * at;
}

export function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}

function smoothFraction(at: number): number {
  return at * at * (3 - 2 * at);
}

function fract(value: number): number {
  return value - Math.floor(value);
}

function wrap(index: number, period: number): number {
  const span = Math.max(1, Math.round(period));
  return ((index % span) + span) % span;
}

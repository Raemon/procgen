const TAU = Math.PI * 2;

export function easeFraction(rate: number, dtSeconds: number): number {
  return 1 - Math.exp(-rate * dtSeconds);
}

export function shortestArc(from: number, to: number): number {
  let delta = (to - from) % TAU;
  if (delta > Math.PI) delta -= TAU;
  if (delta <= -Math.PI) delta += TAU;
  return delta;
}

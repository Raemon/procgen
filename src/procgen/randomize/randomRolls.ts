import type { RandomStream } from '../../random/mulberry32';

export function pick<T>(rng: RandomStream, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length) % items.length]!;
}

export function chance(rng: RandomStream, probability: number): boolean {
  return rng() < probability;
}

export function rollBetween(rng: RandomStream, min: number, max: number): number {
  return min + rng() * (max - min);
}

export function rollInt(rng: RandomStream, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function clamped(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function snappedToStep(value: number, min: number, max: number, step: number): number {
  const stepped = min + Math.round((value - min) / step) * step;
  return clamped(Number(stepped.toFixed(6)), min, max);
}

export function shuffled<T>(rng: RandomStream, items: readonly T[]): T[] {
  const result = [...items];
  for (let last = result.length - 1; last > 0; last--) {
    const swap = Math.floor(rng() * (last + 1));
    [result[last], result[swap]] = [result[swap]!, result[last]!];
  }
  return result;
}

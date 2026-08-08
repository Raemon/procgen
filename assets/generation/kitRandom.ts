import { hashString } from '../../procgen/random/hashString';
import { mulberry32, type RandomStream } from '../../procgen/random/mulberry32';

export interface Weighted<T> {
  value: T;
  weight: number;
}

export function kitStream(seed: number, label: string): RandomStream {
  return mulberry32(hashString(`assetKit:${seed}:${label}`));
}

export function intBetween(random: RandomStream, low: number, high: number): number {
  return low + Math.floor(random() * (high - low + 1));
}

export function pickOne<T>(random: RandomStream, options: readonly T[]): T {
  return options[Math.floor(random() * options.length)] as T;
}

export function pickWeighted<T>(random: RandomStream, options: readonly Weighted<T>[]): T {
  let roll = random() * options.reduce((sum, option) => sum + option.weight, 0);
  for (const option of options) {
    roll -= option.weight;
    if (roll < 0) return option.value;
  }
  return (options[options.length - 1] as Weighted<T>).value;
}

export function rotated<T>(items: readonly T[], start: number): T[] {
  const offset = ((start % items.length) + items.length) % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

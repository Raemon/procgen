import { hashString } from '../../procgen/random/hashString';

export function synthSeed(materialId: string, label: string): number {
  return hashString(`texture:${materialId}:${label}`);
}

export function cellHash01(cellX: number, cellY: number, seed: number): number {
  const mixed = Math.imul(cellX, 0x85ebca6b) ^ Math.imul(cellY, 0xc2b2ae35) ^ seed;
  const scrambled = Math.imul(mixed ^ (mixed >>> 13), 0x27d4eb2f);
  return ((scrambled ^ (scrambled >>> 15)) >>> 0) / 4294967296;
}

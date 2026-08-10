import type { WorldPoint } from './chunkValues';

export const BORN = 'born';
export const PROGRAM = 'program';
export const FACING = 'facing';
export const DEPOSIT_KIND = 'depositKind';
export const RICHNESS = 'richness';
export const CHAIN_ID = 'chainId';

export function pointNumber(point: WorldPoint, key: string, fallback: number): number {
  const value = point.data?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function hasPointNumber(point: WorldPoint, key: string): boolean {
  return typeof point.data?.[key] === 'number' && Number.isFinite(point.data[key]);
}

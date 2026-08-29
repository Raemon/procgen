import type { CreatureId } from '@/features/asset-library/asset';
import { mulberry32, type RandomStream } from '@/features/asset-library/worlds/random/mulberry32';
import { hashString } from '@/features/asset-library/worlds/random/hashString';

export interface CreatureInstance {
  key: string;
  creatureId: CreatureId;
  homeX: number;
  homeY: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  patrolPhase: 1 | -1;
  repathIn: number;
  heading: number;
  moving: boolean;
  attacking: boolean;
  attackSeconds: number;
  rng: RandomStream;
}

export function spawnKeyOf(tag: string, x: number, y: number): string {
  return `${tag}:${x},${y}`;
}

export function spawnedCreature(key: string, creatureId: CreatureId, x: number, y: number): CreatureInstance {
  return {
    key,
    creatureId,
    homeX: x,
    homeY: y,
    x,
    y,
    targetX: x,
    targetY: y,
    patrolPhase: 1,
    repathIn: 0,
    heading: 0,
    moving: false,
    attacking: false,
    attackSeconds: 0,
    rng: mulberry32(hashString(`creature:${key}`)),
  };
}

export function distanceBetween(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(bx - ax, by - ay);
}

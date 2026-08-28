import type { CreatureId } from '@/features/asset-library/asset';
import { mulberry32, type RandomStream } from '@/features/asset-library/worlds/random/mulberry32';
import { hashString } from '@/features/asset-library/worlds/random/hashString';

export interface LiveCreature {
  id: number;
  key: string;
  creatureId: CreatureId;
  x: number;
  y: number;
  heading: number;
  moving: boolean;
  hp: number;
}

export interface LiveCreatureSource {
  active(): readonly LiveCreature[];
}

export interface CreatureInstance extends LiveCreature {
  homeX: number;
  homeY: number;
  targetX: number;
  targetY: number;
  patrolPhase: 1 | -1;
  repathIn: number;
  attackIn: number;
  rng: RandomStream;
}

let nextInstanceId = 1;

export function spawnKeyOf(tag: string, x: number, y: number): string {
  return `${tag}:${x},${y}`;
}

export function spawnedCreature(
  key: string,
  creatureId: CreatureId,
  x: number,
  y: number,
  maxHp: number,
): CreatureInstance {
  return {
    id: nextInstanceId++,
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
    hp: maxHp,
    attackIn: 0,
    rng: mulberry32(hashString(`creature:${key}`)),
  };
}

export function distanceBetween(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(bx - ax, by - ay);
}

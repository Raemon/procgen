import { mulberry32, type RandomStream } from '../../random/mulberry32';
import { hashString } from '../../random/hashString';

export interface CreatureInstance {
  key: string;
  tag: string;
  creatureId: number;
  homeX: number;
  homeY: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  patrolPhase: 1 | -1;
  repathIn: number;
  rng: RandomStream;
}

export function spawnKeyOf(tag: string, x: number, y: number): string {
  return `${tag}:${x},${y}`;
}

export function spawnedCreature(
  key: string,
  tag: string,
  creatureId: number,
  x: number,
  y: number,
): CreatureInstance {
  return {
    key,
    tag,
    creatureId,
    homeX: x,
    homeY: y,
    x,
    y,
    targetX: x,
    targetY: y,
    patrolPhase: 1,
    repathIn: 0,
    rng: mulberry32(hashString(`creature:${key}`)),
  };
}

export function distanceBetween(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(bx - ax, by - ay);
}

import { facingVector, type FacingIndex } from '../facing';
import type { Cell } from '../worldRules';

export const STRIKE_REACH_TILES = 2;

const WITHIN_ARM_S_LENGTH_TILES = 1.2;
const AHEAD_ENOUGH = 0.35;

export interface StrikePose {
  x: number;
  y: number;
  facing: FacingIndex;
}

export interface StandingCreature {
  key: string;
  x: number;
  y: number;
}

export type StrikeOutcome = 'hurt' | 'slain';

export interface StruckCreature {
  name: string;
  outcome: StrikeOutcome;
  at: Cell;
}

export interface StrikeableCreatures {
  strikeFrom(pose: StrikePose): StruckCreature | null;
}

export const NOTHING_ALIVE: StrikeableCreatures = { strikeFrom: () => null };

export function creatureStruckBy<T extends StandingCreature>(
  pose: StrikePose,
  standing: readonly T[],
  reach = STRIKE_REACH_TILES,
): T | null {
  let struck: T | null = null;
  let nearest = Infinity;
  for (const creature of standing) {
    const gap = Math.hypot(creature.x - pose.x, creature.y - pose.y);
    if (gap > reach || gap >= nearest || !isInFrontOf(pose, creature, gap)) continue;
    nearest = gap;
    struck = creature;
  }
  return struck;
}

function isInFrontOf(pose: StrikePose, creature: StandingCreature, gap: number): boolean {
  if (gap <= WITHIN_ARM_S_LENGTH_TILES) return true;
  const swing = facingVector(pose.facing);
  const reachLength = Math.hypot(swing.dx, swing.dy) * gap;
  const alignment = (creature.x - pose.x) * swing.dx + (creature.y - pose.y) * swing.dy;
  return alignment / reachLength >= AHEAD_ENOUGH;
}

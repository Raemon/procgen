import type { CreatureDef } from '@/features/asset-library/creatures/creatureDef';
import type { StrikePose } from '../combat/strikes';
import type { CreatureInstance } from './creatureInstance';

export const SECONDS_BETWEEN_BLOWS = 1.1;
export const RECOIL_SECONDS = 0.4;

export function blowLanded(
  creature: CreatureInstance,
  def: CreatureDef,
  dtSeconds: number,
): boolean {
  creature.strikeIn = Math.max(0, creature.strikeIn - dtSeconds);
  if (!creature.attacking || def.strength <= 0 || creature.strikeIn > 0) return false;
  creature.strikeIn = SECONDS_BETWEEN_BLOWS;
  return true;
}

export function recoilFrom(creature: CreatureInstance, pose: StrikePose): void {
  creature.recoilFor = RECOIL_SECONDS;
  creature.strikeIn = Math.max(creature.strikeIn, SECONDS_BETWEEN_BLOWS);
  creature.targetX = creature.x + (creature.x - pose.x);
  creature.targetY = creature.y + (creature.y - pose.y);
}

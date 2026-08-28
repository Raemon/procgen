import type { FacingIndex } from '../facing';
import type { CreatureSim, StrikeOutcome } from './creatureSim';

export interface StrikePose {
  x: number;
  y: number;
  facing: FacingIndex;
}

export type StrikeReport =
  | { kind: 'sent' }
  | { kind: 'missed' }
  | { kind: 'hit'; outcome: StrikeOutcome };

export interface CombatArena {
  strike(pose: StrikePose): StrikeReport;
}

export interface SimArenaDeps {
  sim(): CreatureSim | null;
  striker(): { id: number; name: string };
  knobs(): { reach: number; damage: number };
}

export function simCombatArena(deps: SimArenaDeps): CombatArena {
  return {
    strike(pose) {
      const sim = deps.sim();
      if (!sim) return { kind: 'missed' };
      const striker = deps.striker();
      const { reach, damage } = deps.knobs();
      const outcome = sim.strikeFrom(
        { id: striker.id, name: striker.name, x: pose.x, y: pose.y },
        pose.facing,
        reach,
        damage,
      );
      return outcome ? { kind: 'hit', outcome } : { kind: 'missed' };
    },
  };
}

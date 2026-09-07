import { LEVEL_STEP } from '../climbing';
import type { Cell } from '../worldRules';
import type { SoundCue } from './soundCues';

export interface FootingTerrain {
  surfaceAt(x: number, y: number): number;
  cratesIn(minX: number, minY: number, maxX: number, maxY: number): Cell[];
}

export function footingCueOf(terrain: FootingTerrain, from: Cell, to: Cell): SoundCue {
  if (terrain.cratesIn(to.x, to.y, to.x, to.y).length > 0) return 'crate-step';
  const rise = terrain.surfaceAt(to.x, to.y) - terrain.surfaceAt(from.x, from.y);
  return rise >= LEVEL_STEP ? 'climb' : 'step';
}

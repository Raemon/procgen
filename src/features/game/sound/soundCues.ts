import { climbSound } from './cues/climbSound';
import { crateStepSound } from './cues/crateStepSound';
import { doorSound } from './cues/doorSound';
import { jumpSound } from './cues/jumpSound';
import { plateSound } from './cues/plateSound';
import { powerSound } from './cues/powerSound';
import { pushSound } from './cues/pushSound';
import { settleSound } from './cues/settleSound';
import { stepSound } from './cues/stepSound';
import type { SoundRecipe } from './soundRecipe';

export type SoundCue =
  | 'step'
  | 'climb'
  | 'crate-step'
  | 'settle'
  | 'jump'
  | 'push'
  | 'plate'
  | 'door'
  | 'power';

export function soundRecipesOf(): Record<SoundCue, SoundRecipe> {
  return {
    step: stepSound(),
    climb: climbSound(),
    'crate-step': crateStepSound(),
    settle: settleSound(),
    jump: jumpSound(),
    push: pushSound(),
    plate: plateSound(),
    door: doorSound(),
    power: powerSound(),
  };
}

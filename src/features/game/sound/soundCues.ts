import { doorSound } from './cues/doorSound';
import { jumpSound } from './cues/jumpSound';
import { plateSound } from './cues/plateSound';
import { powerSound } from './cues/powerSound';
import { pushSound } from './cues/pushSound';
import { stepSound } from './cues/stepSound';
import type { SoundRecipe } from './soundRecipe';

export type SoundCue = 'step' | 'jump' | 'push' | 'plate' | 'door' | 'power';

export function soundRecipesOf(): Record<SoundCue, SoundRecipe> {
  return {
    step: stepSound(),
    jump: jumpSound(),
    push: pushSound(),
    plate: plateSound(),
    door: doorSound(),
    power: powerSound(),
  };
}

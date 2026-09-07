import { doorSound } from './cues/doorSound';
import { hurtSound } from './cues/hurtSound';
import { jumpSound } from './cues/jumpSound';
import { plateSound } from './cues/plateSound';
import { powerSound } from './cues/powerSound';
import { pushSound } from './cues/pushSound';
import { slainSound } from './cues/slainSound';
import { stepSound } from './cues/stepSound';
import { strikeSound } from './cues/strikeSound';
import type { SoundRecipe } from './soundRecipe';

export type SoundCue = 'step' | 'jump' | 'push' | 'plate' | 'door' | 'power' | 'strike' | 'slain' | 'hurt';

export function soundRecipesOf(): Record<SoundCue, SoundRecipe> {
  return {
    step: stepSound(),
    jump: jumpSound(),
    push: pushSound(),
    plate: plateSound(),
    door: doorSound(),
    power: powerSound(),
    strike: strikeSound(),
    slain: slainSound(),
    hurt: hurtSound(),
  };
}

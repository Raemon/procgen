import type { SoundRecipe } from '../soundRecipe';
import { playTone } from '../voices';

export function plateSound(): SoundRecipe {
  return {
    roomSend: 0.25,
    play: (context, _noise, out) => {
      const now = context.currentTime;
      playTone(context, out, { at: now, seconds: 0.35, peak: 0.16, hz: 659, wave: 'sine', attack: 0.01 });
      playTone(context, out, { at: now + 0.09, seconds: 0.45, peak: 0.18, hz: 988, wave: 'sine', attack: 0.01 });
      playTone(context, out, { at: now + 0.09, seconds: 0.3, peak: 0.05, hz: 1976, wave: 'triangle', attack: 0.01 });
    },
  };
}

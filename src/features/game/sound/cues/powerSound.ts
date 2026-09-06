import type { SoundRecipe } from '../soundRecipe';
import { playTone } from '../voices';

const ARPEGGIO_HZ = [523, 659, 784, 1047];

export function powerSound(): SoundRecipe {
  return {
    roomSend: 0.35,
    play: (context, _noise, out) => {
      const now = context.currentTime;
      ARPEGGIO_HZ.forEach((hz, step) => {
        playTone(context, out, { at: now + step * 0.11, seconds: 0.7 - step * 0.08, peak: 0.14, hz, wave: 'sine', attack: 0.02 });
        playTone(context, out, { at: now + step * 0.11, seconds: 0.4, peak: 0.04, hz: hz * 2, wave: 'triangle', attack: 0.02 });
      });
      playTone(context, out, { at: now + 0.44, seconds: 1.1, peak: 0.1, hz: 262, wave: 'triangle', attack: 0.05 });
    },
  };
}

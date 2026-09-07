import type { SoundRecipe } from '../soundRecipe';
import { playNoise, playTone } from '../voices';

export function strikeSound(): SoundRecipe {
  return {
    roomSend: 0.35,
    play: (context, noise, out) => {
      const now = context.currentTime;
      playNoise(context, noise, out, {
        at: now,
        seconds: 0.1,
        peak: 0.22,
        filter: 'bandpass',
        hz: 1600,
        slideTo: 420,
        attack: 0.003,
      });
      playTone(context, out, { at: now, seconds: 0.12, peak: 0.14, hz: 190, slideTo: 90, wave: 'square' });
    },
  };
}

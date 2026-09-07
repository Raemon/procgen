import type { SoundRecipe } from '../soundRecipe';
import { playNoise, playTone } from '../voices';

export function hurtSound(): SoundRecipe {
  return {
    roomSend: 0.5,
    play: (context, noise, out) => {
      const now = context.currentTime;
      playTone(context, out, { at: now, seconds: 0.3, peak: 0.2, hz: 260, slideTo: 70, wave: 'sawtooth' });
      playNoise(context, noise, out, {
        at: now,
        seconds: 0.24,
        peak: 0.12,
        filter: 'lowpass',
        hz: 900,
        slideTo: 220,
        attack: 0.006,
      });
    },
  };
}

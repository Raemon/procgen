import type { SoundRecipe } from '../soundRecipe';
import { playNoise, playTone } from '../voices';

export function slainSound(): SoundRecipe {
  return {
    roomSend: 0.6,
    play: (context, noise, out) => {
      const now = context.currentTime;
      playTone(context, out, { at: now, seconds: 0.5, peak: 0.16, hz: 220, slideTo: 45, wave: 'triangle' });
      playNoise(context, noise, out, {
        at: now + 0.06,
        seconds: 0.42,
        peak: 0.16,
        filter: 'lowpass',
        hz: 640,
        slideTo: 140,
        attack: 0.01,
      });
    },
  };
}

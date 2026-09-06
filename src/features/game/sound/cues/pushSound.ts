import type { SoundRecipe } from '../soundRecipe';
import { playNoise, playTone } from '../voices';

export function pushSound(): SoundRecipe {
  return {
    roomSend: 0.3,
    play: (context, noise, out) => {
      const now = context.currentTime;
      playNoise(context, noise, out, { at: now, seconds: 0.22, peak: 0.28, filter: 'lowpass', hz: 500, slideTo: 260 });
      playTone(context, out, { at: now, seconds: 0.16, peak: 0.18, hz: 75, slideTo: 55, wave: 'triangle' });
    },
  };
}

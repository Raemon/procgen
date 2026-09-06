import type { SoundRecipe } from '../soundRecipe';
import { playNoise, playTone } from '../voices';

export function doorSound(): SoundRecipe {
  return {
    roomSend: 0.3,
    play: (context, noise, out) => {
      const now = context.currentTime;
      playNoise(context, noise, out, { at: now, seconds: 0.45, peak: 0.16, filter: 'bandpass', hz: 300, slideTo: 1400 });
      playTone(context, out, { at: now, seconds: 0.4, peak: 0.08, hz: 90, slideTo: 140, wave: 'sawtooth' });
      playTone(context, out, { at: now + 0.42, seconds: 0.12, peak: 0.22, hz: 100, slideTo: 60, wave: 'sine' });
    },
  };
}

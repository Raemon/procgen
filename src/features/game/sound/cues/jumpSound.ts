import type { SoundRecipe } from '../soundRecipe';
import { playNoise, playTone } from '../voices';

const LANDING_AFTER_SECONDS = 0.5;

export function jumpSound(): SoundRecipe {
  return {
    roomSend: 0.45,
    play: (context, noise, out) => {
      const now = context.currentTime;
      playNoise(context, noise, out, {
        at: now,
        seconds: 0.12,
        peak: 0.05,
        filter: 'lowpass',
        hz: 800,
        slideTo: 300,
        attack: 0.008,
      });
      playTone(context, out, { at: now, seconds: 0.14, peak: 0.07, hz: 150, slideTo: 90, wave: 'sine', attack: 0.006 });
      playNoise(context, noise, out, {
        at: now + 0.03,
        seconds: 0.15,
        peak: 0.014,
        filter: 'highpass',
        hz: 3000,
        attack: 0.04,
      });
      const landing = now + LANDING_AFTER_SECONDS;
      playNoise(context, noise, out, {
        at: landing,
        seconds: 0.18,
        peak: 0.11,
        filter: 'lowpass',
        hz: 900,
        slideTo: 320,
        attack: 0.01,
      });
      playTone(context, out, { at: landing, seconds: 0.16, peak: 0.11, hz: 105, slideTo: 55, wave: 'sine', attack: 0.008 });
    },
  };
}

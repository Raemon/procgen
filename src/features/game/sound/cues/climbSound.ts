import type { SoundRecipe } from '../soundRecipe';
import { playGrind, playNoise, playTone } from '../voices';

const HAUL_SECONDS = 0.26;

export function climbSound(): SoundRecipe {
  return {
    roomSend: 0.55,
    play: (context, noise, out, shape) => {
      const now = context.currentTime;
      const haul = Math.max(HAUL_SECONDS, shape.seconds * 1.3);
      playGrind(context, noise, out, {
        at: now,
        seconds: haul,
        peak: 0.05,
        filter: 'bandpass',
        hz: 430,
        slideTo: 1150,
        attack: 0.04,
        release: haul * 0.35,
        wobbleHz: 21,
        wobbleDepth: 0.35,
      });
      playTone(context, out, {
        at: now,
        seconds: haul,
        peak: 0.035,
        hz: 118,
        slideTo: 176,
        wave: 'triangle',
        attack: 0.05,
        release: haul * 0.4,
      });
      playNoise(context, noise, out, {
        at: now + haul,
        seconds: 0.16,
        peak: 0.07,
        filter: 'lowpass',
        hz: 1050,
        slideTo: 300,
        attack: 0.007,
      });
      playTone(context, out, {
        at: now + haul,
        seconds: 0.2,
        peak: 0.075,
        hz: 112,
        slideTo: 58,
        wave: 'sine',
        attack: 0.006,
      });
      playNoise(context, noise, out, {
        at: now + haul + 0.02,
        seconds: 0.22,
        peak: 0.014,
        filter: 'highpass',
        hz: 3200,
        attack: 0.04,
      });
    },
  };
}

import type { SoundRecipe } from '../soundRecipe';
import { playNoise, playTone } from '../voices';

const HOLLOW_PARTIALS = [
  { hz: 196, peak: 0.09, seconds: 0.22 },
  { hz: 293, peak: 0.045, seconds: 0.16 },
  { hz: 447, peak: 0.022, seconds: 0.11 },
];

export function crateStepSound(): SoundRecipe {
  return {
    roomSend: 0.18,
    play: (context, noise, out, shape) => {
      const now = context.currentTime;
      const weight = 0.85 + 0.35 * shape.effort;
      for (const partial of HOLLOW_PARTIALS) {
        playTone(context, out, {
          at: now,
          seconds: partial.seconds,
          peak: partial.peak * weight,
          hz: partial.hz,
          slideTo: partial.hz * 0.94,
          wave: 'triangle',
          attack: 0.004,
        });
      }
      playTone(context, out, {
        at: now,
        seconds: 0.09,
        peak: 0.05 * weight,
        hz: 1180,
        slideTo: 620,
        wave: 'square',
        attack: 0.002,
      });
      playNoise(context, noise, out, {
        at: now,
        seconds: 0.07,
        peak: 0.02 * weight,
        filter: 'bandpass',
        hz: 2600,
        attack: 0.003,
      });
    },
  };
}

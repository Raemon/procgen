import type { SoundRecipe } from '../soundRecipe';
import { playNoise, playTone } from '../voices';

const STEP_PITCH_SPREAD = 0.12;
const STEP_WEIGHT_SPREAD = 0.25;
const FOOT_PITCH_OFFSET = 0.06;

export function stepSound(): SoundRecipe {
  let footfall = 0;
  return {
    roomSend: 0.5,
    play: (context, noise, out) => {
      const now = context.currentTime;
      const foot = footfall++ % 2 === 0 ? 1 + FOOT_PITCH_OFFSET : 1 - FOOT_PITCH_OFFSET;
      const spread = foot * (1 + (Math.random() * 2 - 1) * STEP_PITCH_SPREAD);
      const weight = 1 + (Math.random() * 2 - 1) * STEP_WEIGHT_SPREAD;
      playNoise(context, noise, out, {
        at: now,
        seconds: 0.13,
        peak: 0.06 * weight,
        filter: 'lowpass',
        hz: 1100 * spread,
        slideTo: 380,
        attack: 0.012,
      });
      playNoise(context, noise, out, {
        at: now + 0.02,
        seconds: 0.17,
        peak: 0.018 * weight,
        filter: 'highpass',
        hz: 2600,
        attack: 0.03,
      });
      playTone(context, out, {
        at: now,
        seconds: 0.11,
        peak: 0.05 * weight,
        hz: 95 * spread,
        slideTo: 55,
        wave: 'sine',
        attack: 0.01,
      });
    },
  };
}

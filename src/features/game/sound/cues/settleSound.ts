import type { SoundRecipe } from '../soundRecipe';
import { playNoise, playTone } from '../voices';

const HEEL_DRAG_SECONDS = 0.24;

export function settleSound(): SoundRecipe {
  return {
    roomSend: 0.6,
    play: (context, noise, out, shape) => {
      const now = context.currentTime;
      const carried = 0.6 + 0.7 * shape.effort;
      const drag = HEEL_DRAG_SECONDS * (0.7 + 0.8 * shape.effort);
      playNoise(context, noise, out, {
        at: now,
        seconds: drag,
        peak: 0.03 * carried,
        filter: 'bandpass',
        hz: 760,
        slideTo: 260,
        attack: 0.012,
        release: drag * 0.75,
      });
      playNoise(context, noise, out, {
        at: now + drag * 0.55,
        seconds: 0.15,
        peak: 0.05 * carried,
        filter: 'lowpass',
        hz: 620,
        slideTo: 220,
        attack: 0.008,
      });
      playTone(context, out, {
        at: now + drag * 0.55,
        seconds: 0.22,
        peak: 0.06 * carried,
        hz: 88,
        slideTo: 46,
        wave: 'sine',
        attack: 0.008,
      });
      playNoise(context, noise, out, {
        at: now + drag * 0.55 + 0.03,
        seconds: 0.3,
        peak: 0.008 * carried,
        filter: 'highpass',
        hz: 1900,
        attack: 0.05,
      });
    },
  };
}

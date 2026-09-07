import type { SoundRecipe } from '../soundRecipe';
import { playNoise, playTone } from '../voices';

interface Footfall {
  scuffHz: number;
  contactHz: number;
  gritHz: number;
  bodyHz: number;
  weight: number;
}

const FOOTFALLS: Footfall[] = [
  { scuffHz: 940, contactHz: 1100, gritHz: 2400, bodyHz: 96, weight: 1 },
  { scuffHz: 1260, contactHz: 1320, gritHz: 3100, bodyHz: 88, weight: 0.84 },
  { scuffHz: 780, contactHz: 900, gritHz: 1900, bodyHz: 106, weight: 1.12 },
  { scuffHz: 1080, contactHz: 1180, gritHz: 2750, bodyHz: 92, weight: 0.93 },
  { scuffHz: 860, contactHz: 1010, gritHz: 2150, bodyHz: 101, weight: 1.06 },
];

const PITCH_JITTER = 0.08;
const WEIGHT_JITTER = 0.16;
const MOMENTUM_SETTLING = 0.17;
const MOMENTUM_BRIGHTNESS = 0.45;
const MOMENTUM_SLIDE = 0.6;

export function stepSound(): SoundRecipe {
  let footfall = 0;
  return {
    roomSend: 0.5,
    play: (context, noise, out, shape) => {
      const now = context.currentTime;
      const foot = FOOTFALLS[footfall++ % FOOTFALLS.length]!;
      const jitter = 1 + (Math.random() * 2 - 1) * PITCH_JITTER;
      const settled = 1 - MOMENTUM_SETTLING * shape.effort;
      const weight = foot.weight * (1 + (Math.random() * 2 - 1) * WEIGHT_JITTER);
      const slide = Math.max(0.07, shape.seconds * (0.55 + MOMENTUM_SLIDE * shape.effort));
      playNoise(context, noise, out, {
        at: now,
        seconds: slide,
        peak: 0.026 * weight,
        filter: 'bandpass',
        hz: foot.scuffHz * jitter * settled,
        slideTo: foot.scuffHz * 0.4 * settled,
        attack: 0.018 + 0.03 * shape.effort,
        release: slide * 0.5,
      });
      playNoise(context, noise, out, {
        at: now,
        seconds: 0.12,
        peak: 0.055 * weight,
        filter: 'lowpass',
        hz: foot.contactHz * jitter * settled,
        slideTo: 380,
        attack: 0.011,
      });
      playNoise(context, noise, out, {
        at: now + 0.02,
        seconds: 0.16,
        peak: 0.016 * weight,
        filter: 'highpass',
        hz: foot.gritHz * (1 + MOMENTUM_BRIGHTNESS * shape.effort),
        attack: 0.03,
      });
      playTone(context, out, {
        at: now,
        seconds: 0.105,
        peak: 0.048 * weight,
        hz: foot.bodyHz * jitter * settled,
        slideTo: 52,
        wave: 'sine',
        attack: 0.009,
      });
    },
  };
}

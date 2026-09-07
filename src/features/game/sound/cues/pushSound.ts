import type { SoundRecipe } from '../soundRecipe';
import { playGrind, playNoise, playTone } from '../voices';

const SHORTEST_GRIND_SECONDS = 0.12;

export function pushSound(): SoundRecipe {
  return {
    roomSend: 0.42,
    play: (context, noise, out, shape) => {
      const now = context.currentTime;
      const grind = Math.max(SHORTEST_GRIND_SECONDS, shape.seconds);
      const mass = 0.75 + 0.5 * shape.effort;
      playGrind(context, noise, out, {
        at: now,
        seconds: grind,
        peak: 0.16 * mass,
        filter: 'lowpass',
        hz: 560,
        slideTo: 300,
        attack: 0.03,
        release: 0.05,
        wobbleHz: 27,
        wobbleDepth: 0.42,
      });
      playGrind(context, noise, out, {
        at: now,
        seconds: grind,
        peak: 0.1 * mass,
        filter: 'bandpass',
        hz: 190,
        slideTo: 130,
        attack: 0.04,
        release: 0.05,
        wobbleHz: 17,
        wobbleDepth: 0.3,
      });
      playTone(context, out, {
        at: now,
        seconds: grind,
        peak: 0.085 * mass,
        hz: 63,
        slideTo: 49,
        wave: 'triangle',
        attack: 0.04,
        release: 0.06,
      });
      settleThud(context, noise, out, now + grind, mass);
    },
  };
}

function settleThud(context: AudioContext, noise: AudioBuffer, out: AudioNode, at: number, mass: number): void {
  playNoise(context, noise, out, {
    at,
    seconds: 0.26,
    peak: 0.22 * mass,
    filter: 'lowpass',
    hz: 430,
    slideTo: 130,
    attack: 0.005,
  });
  playTone(context, out, { at, seconds: 0.3, peak: 0.19 * mass, hz: 78, slideTo: 43, wave: 'sine', attack: 0.005 });
  playTone(context, out, {
    at: at + 0.02,
    seconds: 0.5,
    peak: 0.05 * mass,
    hz: 41,
    slideTo: 33,
    wave: 'triangle',
    attack: 0.02,
  });
}

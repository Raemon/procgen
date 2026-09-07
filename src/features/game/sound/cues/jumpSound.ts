import { JUMP_MS } from '../../sim/movementOrder';
import type { SoundRecipe } from '../soundRecipe';
import { playNoise, playTone } from '../voices';

const AIRTIME_SECONDS = JUMP_MS / 1000;

export function jumpSound(): SoundRecipe {
  return {
    roomSend: 0.45,
    play: (context, noise, out, shape) => {
      const now = context.currentTime;
      const drive = 0.85 + 0.4 * shape.effort;
      pushOff(context, noise, out, now, drive);
      touchDown(context, noise, out, now + AIRTIME_SECONDS, drive);
    },
  };
}

function pushOff(context: AudioContext, noise: AudioBuffer, out: AudioNode, at: number, drive: number): void {
  playNoise(context, noise, out, {
    at,
    seconds: 0.13,
    peak: 0.05 * drive,
    filter: 'lowpass',
    hz: 850,
    slideTo: 300,
    attack: 0.008,
  });
  playTone(context, out, {
    at,
    seconds: 0.15,
    peak: 0.07 * drive,
    hz: 148,
    slideTo: 214,
    wave: 'sine',
    attack: 0.006,
  });
  playNoise(context, noise, out, {
    at: at + 0.03,
    seconds: AIRTIME_SECONDS * 0.7,
    peak: 0.009,
    filter: 'highpass',
    hz: 3400,
    attack: 0.06,
    release: AIRTIME_SECONDS * 0.5,
  });
}

function touchDown(context: AudioContext, noise: AudioBuffer, out: AudioNode, at: number, drive: number): void {
  playNoise(context, noise, out, {
    at,
    seconds: 0.2,
    peak: 0.13 * drive,
    filter: 'lowpass',
    hz: 950,
    slideTo: 260,
    attack: 0.006,
  });
  playTone(context, out, {
    at,
    seconds: 0.24,
    peak: 0.13 * drive,
    hz: 102,
    slideTo: 44,
    wave: 'sine',
    attack: 0.006,
  });
  playNoise(context, noise, out, {
    at: at + 0.04,
    seconds: 0.2,
    peak: 0.024 * drive,
    filter: 'bandpass',
    hz: 640,
    slideTo: 210,
    attack: 0.03,
    release: 0.14,
  });
}

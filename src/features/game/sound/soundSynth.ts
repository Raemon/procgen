export type SoundCue = 'step' | 'jump' | 'push' | 'plate' | 'door' | 'power';

export interface SoundPlayer {
  play(cue: SoundCue, volume?: number): void;
  dispose(): void;
}

const SILENT_PLAYER: SoundPlayer = { play: () => undefined, dispose: () => undefined };

const MASTER_GAIN = 0.7;
const NOISE_SECONDS = 1;
const STEP_PITCH_SPREAD = 0.18;

interface Voice {
  at: number;
  seconds: number;
  peak: number;
}

interface ToneVoice extends Voice {
  hz: number;
  slideTo?: number;
  wave?: OscillatorType;
  attack?: number;
}

interface NoiseVoice extends Voice {
  filter: BiquadFilterType;
  hz: number;
  slideTo?: number;
}

const UNLOCKING_GESTURES = ['keydown', 'pointerdown'] as const;

export function createSoundPlayer(): SoundPlayer {
  if (typeof AudioContext === 'undefined') return SILENT_PLAYER;
  let context: AudioContext | null = null;
  let master: GainNode | null = null;
  let noise: AudioBuffer | null = null;
  const ready = (): { context: AudioContext; master: GainNode; noise: AudioBuffer } => {
    context ??= new AudioContext();
    master ??= masterGainOf(context);
    noise ??= whiteNoiseOf(context);
    if (context.state === 'suspended') void context.resume();
    return { context, master, noise };
  };
  const unlock = (): void => void ready();
  for (const gesture of UNLOCKING_GESTURES) window.addEventListener(gesture, unlock);
  return {
    play: (cue, volume = 1) => {
      const audio = ready();
      if (audio.context.state !== 'running') return;
      const out = audio.context.createGain();
      out.gain.value = Math.max(0, Math.min(1, volume));
      out.connect(audio.master);
      CUES[cue](audio.context, audio.noise, out);
    },
    dispose: () => {
      for (const gesture of UNLOCKING_GESTURES) window.removeEventListener(gesture, unlock);
      void context?.close();
      context = null;
      master = null;
      noise = null;
    },
  };
}

type CueRecipe = (context: AudioContext, noise: AudioBuffer, out: AudioNode) => void;

const CUES: Record<SoundCue, CueRecipe> = {
  step: (context, noise, out) => {
    const now = context.currentTime;
    const spread = 1 + (Math.random() * 2 - 1) * STEP_PITCH_SPREAD;
    playNoise(context, noise, out, { at: now, seconds: 0.07, peak: 0.22, filter: 'bandpass', hz: 900 * spread });
    playTone(context, out, { at: now, seconds: 0.06, peak: 0.16, hz: 120 * spread, slideTo: 70, wave: 'sine' });
  },
  jump: (context, noise, out) => {
    const now = context.currentTime;
    playTone(context, out, { at: now, seconds: 0.2, peak: 0.16, hz: 220, slideTo: 660, wave: 'triangle' });
    playNoise(context, noise, out, { at: now, seconds: 0.09, peak: 0.1, filter: 'highpass', hz: 1800 });
    playNoise(context, noise, out, { at: now + 0.5, seconds: 0.08, peak: 0.24, filter: 'lowpass', hz: 700 });
    playTone(context, out, { at: now + 0.5, seconds: 0.09, peak: 0.2, hz: 110, slideTo: 60, wave: 'sine' });
  },
  push: (context, noise, out) => {
    const now = context.currentTime;
    playNoise(context, noise, out, { at: now, seconds: 0.22, peak: 0.28, filter: 'lowpass', hz: 500, slideTo: 260 });
    playTone(context, out, { at: now, seconds: 0.16, peak: 0.18, hz: 75, slideTo: 55, wave: 'triangle' });
  },
  plate: (context, _noise, out) => {
    const now = context.currentTime;
    playTone(context, out, { at: now, seconds: 0.35, peak: 0.16, hz: 659, wave: 'sine', attack: 0.01 });
    playTone(context, out, { at: now + 0.09, seconds: 0.45, peak: 0.18, hz: 988, wave: 'sine', attack: 0.01 });
    playTone(context, out, { at: now + 0.09, seconds: 0.3, peak: 0.05, hz: 1976, wave: 'triangle', attack: 0.01 });
  },
  door: (context, noise, out) => {
    const now = context.currentTime;
    playNoise(context, noise, out, { at: now, seconds: 0.45, peak: 0.16, filter: 'bandpass', hz: 300, slideTo: 1400 });
    playTone(context, out, { at: now, seconds: 0.4, peak: 0.08, hz: 90, slideTo: 140, wave: 'sawtooth' });
    playTone(context, out, { at: now + 0.42, seconds: 0.12, peak: 0.22, hz: 100, slideTo: 60, wave: 'sine' });
  },
  power: (context, _noise, out) => {
    const now = context.currentTime;
    [523, 659, 784, 1047].forEach((hz, step) => {
      playTone(context, out, { at: now + step * 0.11, seconds: 0.7 - step * 0.08, peak: 0.14, hz, wave: 'sine', attack: 0.02 });
      playTone(context, out, { at: now + step * 0.11, seconds: 0.4, peak: 0.04, hz: hz * 2, wave: 'triangle', attack: 0.02 });
    });
    playTone(context, out, { at: now + 0.44, seconds: 1.1, peak: 0.1, hz: 262, wave: 'triangle', attack: 0.05 });
  },
};

function playTone(context: AudioContext, out: AudioNode, voice: ToneVoice): void {
  const oscillator = context.createOscillator();
  oscillator.type = voice.wave ?? 'sine';
  oscillator.frequency.setValueAtTime(voice.hz, voice.at);
  if (voice.slideTo) oscillator.frequency.exponentialRampToValueAtTime(voice.slideTo, voice.at + voice.seconds);
  const envelope = envelopeOf(context, voice);
  oscillator.connect(envelope);
  envelope.connect(out);
  oscillator.start(voice.at);
  oscillator.stop(voice.at + voice.seconds + 0.02);
}

function playNoise(context: AudioContext, noise: AudioBuffer, out: AudioNode, voice: NoiseVoice): void {
  const source = context.createBufferSource();
  source.buffer = noise;
  source.loop = true;
  const filter = context.createBiquadFilter();
  filter.type = voice.filter;
  filter.frequency.setValueAtTime(voice.hz, voice.at);
  if (voice.slideTo) filter.frequency.exponentialRampToValueAtTime(voice.slideTo, voice.at + voice.seconds);
  const envelope = envelopeOf(context, voice);
  source.connect(filter);
  filter.connect(envelope);
  envelope.connect(out);
  source.start(voice.at, Math.random() * (NOISE_SECONDS / 2));
  source.stop(voice.at + voice.seconds + 0.02);
}

function envelopeOf(context: AudioContext, voice: Voice & { attack?: number }): GainNode {
  const attack = voice.attack ?? 0.004;
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, voice.at);
  gain.gain.linearRampToValueAtTime(voice.peak, voice.at + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, voice.at + voice.seconds);
  return gain;
}

function masterGainOf(context: AudioContext): GainNode {
  const gain = context.createGain();
  gain.gain.value = MASTER_GAIN;
  gain.connect(context.destination);
  return gain;
}

function whiteNoiseOf(context: AudioContext): AudioBuffer {
  const buffer = context.createBuffer(1, Math.round(context.sampleRate * NOISE_SECONDS), context.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let index = 0; index < samples.length; index++) samples[index] = Math.random() * 2 - 1;
  return buffer;
}

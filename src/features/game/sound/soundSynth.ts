export type SoundCue = 'step' | 'jump' | 'push' | 'plate' | 'door' | 'power';

export interface SoundPlayer {
  play(cue: SoundCue, volume?: number): void;
  dispose(): void;
}

const SILENT_PLAYER: SoundPlayer = { play: () => undefined, dispose: () => undefined };

const MASTER_GAIN = 0.7;
const NOISE_SECONDS = 1;
const STEP_PITCH_SPREAD = 0.12;
const STEP_WEIGHT_SPREAD = 0.25;
const FOOT_PITCH_OFFSET = 0.06;
const ROOM_SECONDS = 1.4;
const ROOM_DECAY = 3.2;

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
  attack?: number;
}

const CUE_ROOM_SEND: Record<SoundCue, number> = {
  step: 0.5,
  jump: 0.45,
  push: 0.3,
  plate: 0.25,
  door: 0.3,
  power: 0.35,
};

const UNLOCKING_GESTURES = ['keydown', 'pointerdown'] as const;

let footfall = 0;

export function createSoundPlayer(isOn: () => boolean = () => true): SoundPlayer {
  if (typeof AudioContext === 'undefined') return SILENT_PLAYER;
  let context: AudioContext | null = null;
  let master: GainNode | null = null;
  let room: ConvolverNode | null = null;
  let noise: AudioBuffer | null = null;
  const ready = (): { context: AudioContext; master: GainNode; room: ConvolverNode; noise: AudioBuffer } => {
    context ??= new AudioContext();
    master ??= masterGainOf(context);
    room ??= roomReverbOf(context, master);
    noise ??= whiteNoiseOf(context);
    if (context.state === 'suspended') void context.resume();
    return { context, master, room, noise };
  };
  const unlock = (): void => {
    if (isOn()) ready();
  };
  for (const gesture of UNLOCKING_GESTURES) window.addEventListener(gesture, unlock);
  return {
    play: (cue, volume = 1) => {
      const audio = ready();
      if (audio.context.state !== 'running') return;
      const out = audio.context.createGain();
      out.gain.value = Math.max(0, Math.min(1, volume));
      out.connect(audio.master);
      const send = audio.context.createGain();
      send.gain.value = CUE_ROOM_SEND[cue];
      out.connect(send);
      send.connect(audio.room);
      CUES[cue](audio.context, audio.noise, out);
    },
    dispose: () => {
      for (const gesture of UNLOCKING_GESTURES) window.removeEventListener(gesture, unlock);
      void context?.close();
      context = null;
      master = null;
      room = null;
      noise = null;
    },
  };
}

type CueRecipe = (context: AudioContext, noise: AudioBuffer, out: AudioNode) => void;

const CUES: Record<SoundCue, CueRecipe> = {
  step: (context, noise, out) => {
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
  jump: (context, noise, out) => {
    const now = context.currentTime;
    playTone(context, out, { at: now, seconds: 0.2, peak: 0.16, hz: 220, slideTo: 660, wave: 'triangle' });
    playNoise(context, noise, out, { at: now, seconds: 0.09, peak: 0.1, filter: 'highpass', hz: 1800 });
    playNoise(context, noise, out, {
      at: now + 0.5,
      seconds: 0.18,
      peak: 0.11,
      filter: 'lowpass',
      hz: 900,
      slideTo: 320,
      attack: 0.01,
    });
    playTone(context, out, { at: now + 0.5, seconds: 0.16, peak: 0.11, hz: 105, slideTo: 55, wave: 'sine', attack: 0.008 });
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

function roomReverbOf(context: AudioContext, master: GainNode): ConvolverNode {
  const convolver = context.createConvolver();
  convolver.buffer = roomImpulseOf(context);
  const damping = context.createBiquadFilter();
  damping.type = 'lowpass';
  damping.frequency.value = 2200;
  convolver.connect(damping);
  damping.connect(master);
  return convolver;
}

function roomImpulseOf(context: AudioContext): AudioBuffer {
  const length = Math.round(context.sampleRate * ROOM_SECONDS);
  const buffer = context.createBuffer(2, length, context.sampleRate);
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const samples = buffer.getChannelData(channel);
    for (let index = 0; index < length; index++) {
      samples[index] = (Math.random() * 2 - 1) * (1 - index / length) ** ROOM_DECAY;
    }
  }
  return buffer;
}

function whiteNoiseOf(context: AudioContext): AudioBuffer {
  const buffer = context.createBuffer(1, Math.round(context.sampleRate * NOISE_SECONDS), context.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let index = 0; index < samples.length; index++) samples[index] = Math.random() * 2 - 1;
  return buffer;
}

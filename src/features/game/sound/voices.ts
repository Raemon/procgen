import { NOISE_SECONDS } from './audioGraph';

export interface Voice {
  at: number;
  seconds: number;
  peak: number;
  attack?: number;
  release?: number;
}

export interface ToneVoice extends Voice {
  hz: number;
  slideTo?: number;
  wave?: OscillatorType;
}

export interface NoiseVoice extends Voice {
  filter: BiquadFilterType;
  hz: number;
  slideTo?: number;
}

export interface GrindVoice extends NoiseVoice {
  wobbleHz: number;
  wobbleDepth: number;
}

export function playTone(context: AudioContext, out: AudioNode, voice: ToneVoice): void {
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

export function playNoise(context: AudioContext, noise: AudioBuffer, out: AudioNode, voice: NoiseVoice): void {
  const envelope = envelopeOf(context, voice);
  envelope.connect(out);
  runNoiseThrough(context, noise, envelope, voice);
}

export function playGrind(context: AudioContext, noise: AudioBuffer, out: AudioNode, voice: GrindVoice): void {
  const envelope = envelopeOf(context, voice);
  const wobble = context.createGain();
  wobble.gain.setValueAtTime(1 - voice.wobbleDepth, voice.at);
  const shudder = context.createOscillator();
  shudder.type = 'sine';
  shudder.frequency.setValueAtTime(voice.wobbleHz, voice.at);
  const depth = context.createGain();
  depth.gain.setValueAtTime(voice.wobbleDepth, voice.at);
  shudder.connect(depth);
  depth.connect(wobble.gain);
  shudder.start(voice.at);
  shudder.stop(voice.at + voice.seconds + 0.02);
  envelope.connect(wobble);
  wobble.connect(out);
  runNoiseThrough(context, noise, envelope, voice);
}

function runNoiseThrough(
  context: AudioContext,
  noise: AudioBuffer,
  envelope: GainNode,
  voice: NoiseVoice,
): void {
  const source = context.createBufferSource();
  source.buffer = noise;
  source.loop = true;
  const filter = context.createBiquadFilter();
  filter.type = voice.filter;
  filter.frequency.setValueAtTime(voice.hz, voice.at);
  if (voice.slideTo) filter.frequency.exponentialRampToValueAtTime(voice.slideTo, voice.at + voice.seconds);
  source.connect(filter);
  filter.connect(envelope);
  source.start(voice.at, Math.random() * (NOISE_SECONDS / 2));
  source.stop(voice.at + voice.seconds + 0.02);
}

function envelopeOf(context: AudioContext, voice: Voice): GainNode {
  const attack = voice.attack ?? 0.004;
  const gain = context.createGain();
  gain.gain.value = 0.0001;
  gain.gain.setValueAtTime(0.0001, voice.at);
  gain.gain.linearRampToValueAtTime(voice.peak, voice.at + attack);
  const holdUntil = voice.at + Math.max(attack, voice.seconds - (voice.release ?? voice.seconds));
  if (holdUntil > voice.at + attack) gain.gain.setValueAtTime(voice.peak, holdUntil);
  gain.gain.exponentialRampToValueAtTime(0.0001, voice.at + voice.seconds);
  return gain;
}

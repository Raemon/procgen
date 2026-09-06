import { NOISE_SECONDS } from './audioGraph';

export interface Voice {
  at: number;
  seconds: number;
  peak: number;
}

export interface ToneVoice extends Voice {
  hz: number;
  slideTo?: number;
  wave?: OscillatorType;
  attack?: number;
}

export interface NoiseVoice extends Voice {
  filter: BiquadFilterType;
  hz: number;
  slideTo?: number;
  attack?: number;
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

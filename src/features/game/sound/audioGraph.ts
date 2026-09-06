export const MASTER_GAIN = 0.7;
export const NOISE_SECONDS = 1;
const ROOM_SECONDS = 1.4;
const ROOM_DECAY = 3.2;
const ROOM_DAMPING_HZ = 2200;

export interface AudioGraph {
  context: AudioContext;
  master: GainNode;
  room: ConvolverNode;
  noise: AudioBuffer;
}

export function audioGraphOf(context: AudioContext): AudioGraph {
  const master = masterGainOf(context);
  return { context, master, room: roomReverbOf(context, master), noise: whiteNoiseOf(context) };
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
  damping.frequency.value = ROOM_DAMPING_HZ;
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

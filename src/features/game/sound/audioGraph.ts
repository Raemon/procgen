export const MASTER_GAIN = 0.7;
export const NOISE_SECONDS = 1;

interface RoomSize {
  seconds: number;
  decay: number;
  dampingHz: number;
}

const CLOSE_ROOM: RoomSize = { seconds: 0.55, decay: 5.5, dampingHz: 1500 };
const WIDE_ROOM: RoomSize = { seconds: 2.6, decay: 2.1, dampingHz: 2600 };

export interface AudioGraph {
  context: AudioContext;
  master: GainNode;
  closeRoom: ConvolverNode;
  wideRoom: ConvolverNode;
  noise: AudioBuffer;
}

export function audioGraphOf(context: AudioContext): AudioGraph {
  const master = masterGainOf(context);
  return {
    context,
    master,
    closeRoom: reverbOf(context, master, CLOSE_ROOM),
    wideRoom: reverbOf(context, master, WIDE_ROOM),
    noise: whiteNoiseOf(context),
  };
}

function masterGainOf(context: AudioContext): GainNode {
  const gain = context.createGain();
  gain.gain.value = MASTER_GAIN;
  gain.connect(context.destination);
  return gain;
}

function reverbOf(context: AudioContext, master: GainNode, size: RoomSize): ConvolverNode {
  const convolver = context.createConvolver();
  convolver.buffer = roomImpulseOf(context, size);
  const damping = context.createBiquadFilter();
  damping.type = 'lowpass';
  damping.frequency.value = size.dampingHz;
  convolver.connect(damping);
  damping.connect(master);
  return convolver;
}

function roomImpulseOf(context: AudioContext, size: RoomSize): AudioBuffer {
  const length = Math.round(context.sampleRate * size.seconds);
  const buffer = context.createBuffer(2, length, context.sampleRate);
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const samples = buffer.getChannelData(channel);
    for (let index = 0; index < length; index++) {
      samples[index] = (Math.random() * 2 - 1) * (1 - index / length) ** size.decay;
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

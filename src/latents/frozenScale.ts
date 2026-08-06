import type { FrozenScale } from './latentTypes';

const SAMPLES_PER_CHANNEL = 2048;

export function freezeScale(channels: Float32Array[]): FrozenScale {
  return { sortedSamples: channels.map(sortedSubsample) };
}

export function quantileOf(scale: FrozenScale, channelIndex: number, value: number): number {
  const samples = scale.sortedSamples[channelIndex];
  if (!samples || samples.length === 0) return 0.5;
  return binarySearchPosition(samples, value) / samples.length;
}

function sortedSubsample(channel: Float32Array): Float32Array {
  const stride = Math.max(1, Math.floor(channel.length / SAMPLES_PER_CHANNEL));
  const taken: number[] = [];
  for (let i = 0; i < channel.length; i += stride) taken.push(channel[i]!);
  return Float32Array.from(taken).sort();
}

function binarySearchPosition(samples: Float32Array, value: number): number {
  let low = 0;
  let high = samples.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (samples[middle]! < value) low = middle + 1;
    else high = middle;
  }
  return low;
}

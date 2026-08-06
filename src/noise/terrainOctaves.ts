import { gradientNoise } from './gradientNoise';

export const NOISE_STYLE_FBM = 0;
export const NOISE_STYLE_RIDGED = 1;
export const NOISE_STYLE_BILLOW = 2;

export interface OctaveSpec {
  style: number;
  octaves: number;
  lacunarity: number;
  gain: number;
}

export function terrainOctaves(x: number, y: number, seed: number, spec: OctaveSpec): number {
  let sum = 0;
  let amplitudeTotal = 0;
  let amplitude = 1;
  let frequency = 1;
  let previous = 1;
  for (let octave = 0; octave < spec.octaves; octave++) {
    const shaped = shapedOctave(spec.style, gradientNoise(x * frequency, y * frequency, seedFor(seed, octave)));
    const weight = spec.style === NOISE_STYLE_RIDGED ? previous : 1;
    sum += shaped * amplitude * weight;
    amplitudeTotal += amplitude * weight;
    previous = Math.max(0.1, shaped);
    amplitude *= spec.gain;
    frequency *= spec.lacunarity;
  }
  return amplitudeTotal === 0 ? 0 : sum / amplitudeTotal;
}

function shapedOctave(style: number, noise: number): number {
  if (style === NOISE_STYLE_RIDGED) return 1 - Math.abs(noise * 2 - 1);
  if (style === NOISE_STYLE_BILLOW) return Math.abs(noise * 2 - 1);
  return noise;
}

const SEED_OFFSET_PER_OCTAVE = 0x9e3779b9;

function seedFor(seed: number, octave: number): number {
  return (seed + octave * SEED_OFFSET_PER_OCTAVE) | 0;
}

import { valueNoise } from './valueNoise';

const LACUNARITY = 2;
const GAIN = 0.5;
const SEED_OFFSET_PER_OCTAVE = 0x9e3779b9;

export function fractalNoise(x: number, y: number, seed: number, octaves: number): number {
  let sum = 0;
  let amplitude = 1;
  let amplitudeTotal = 0;
  let frequency = 1;
  for (let octave = 0; octave < octaves; octave++) {
    sum += valueNoise(x * frequency, y * frequency, seedForOctave(seed, octave)) * amplitude;
    amplitudeTotal += amplitude;
    amplitude *= GAIN;
    frequency *= LACUNARITY;
  }
  return sum / amplitudeTotal;
}

function seedForOctave(seed: number, octave: number): number {
  return (seed + octave * SEED_OFFSET_PER_OCTAVE) | 0;
}

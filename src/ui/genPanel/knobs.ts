import type { GenParams } from '../../gen/genParams';

export interface Knob {
  key: keyof GenParams;
  label: string;
  min: number;
  max: number;
  step: number;
}

export const KNOBS: readonly Knob[] = [
  { key: 'size', label: 'world size', min: 48, max: 128, step: 1 },
  { key: 'noiseScale', label: 'noise scale', min: 0.02, max: 0.16, step: 0.005 },
  { key: 'waterLevel', label: 'water level', min: 0, max: 1, step: 0.01 },
  { key: 'rockLevel', label: 'rock level', min: 0, max: 1, step: 0.01 },
  { key: 'smoothing', label: 'smoothing', min: 0, max: 5, step: 1 },
  { key: 'treeDensity', label: 'tree density', min: 0, max: 1, step: 0.01 },
];

export function formatKnobValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(value < 0.2 ? 3 : 2);
}

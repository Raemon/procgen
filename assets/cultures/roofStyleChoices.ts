import { GABLE_ROOF, HIP_ROOF } from './cultureDef';

export interface RoofStyleChoice {
  value: number;
  label: string;
  help: string;
}

export const ROOF_STYLE_CHOICES: readonly RoofStyleChoice[] = [
  {
    value: GABLE_ROOF,
    label: 'gable',
    help: 'Two slopes meeting at a ridge, with a flat triangular wall closing each end.',
  },
  {
    value: HIP_ROOF,
    label: 'hip',
    help: 'Four slopes rising to a short ridge, so no wall is left standing above the eaves.',
  },
];

export function roofStyleLabel(roofStyle: number): string {
  return roofStyle === HIP_ROOF ? 'hip' : 'gable';
}

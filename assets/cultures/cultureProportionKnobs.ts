import {
  MAX_STORY_LAYERS,
  MAX_WINDOW_EVERY,
  MIN_STORY_LAYERS,
  MIN_WINDOW_EVERY,
  type Culture,
} from './cultureDef';

type CultureProportionField = 'storyLayers' | 'windowEvery';

export interface CultureProportionKnob {
  field: CultureProportionField;
  param: string;
  label: string;
  min: number;
  max: number;
  shapes: string;
}

export const CULTURE_PROPORTION_KNOBS: readonly CultureProportionKnob[] = [
  {
    field: 'storyLayers',
    param: 'story_layers',
    label: 'story layers',
    min: MIN_STORY_LAYERS,
    max: MAX_STORY_LAYERS,
    shapes: 'How many voxel layers tall one story of wall stands, so how tall the whole building is.',
  },
  {
    field: 'windowEvery',
    param: 'window_every',
    label: 'window every',
    min: MIN_WINDOW_EVERY,
    max: MAX_WINDOW_EVERY,
    shapes: 'A window interrupts the wall this often, counted in cells along each side.',
  },
];

export function proportionOf(culture: Culture, knob: CultureProportionKnob): number {
  return culture[knob.field];
}

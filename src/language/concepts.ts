export const LANGUAGE_CONCEPTS = [
  'water',
  'stone',
  'tree',
  'grass',
  'sand',
  'snow',
  'ice',
  'marsh',
  'fire',
  'sea',
  'land',
  'high',
  'deep',
  'still',
  'swift',
  'meet',
  'cold',
  'dark',
] as const;

export type LanguageConcept = (typeof LANGUAGE_CONCEPTS)[number];

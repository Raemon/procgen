export const BUILDING_PROGRAMS = ['cottage', 'dwelling', 'smithy', 'inn', 'townHall'] as const;

export type BuildingProgram = (typeof BUILDING_PROGRAMS)[number];

export interface MassingRules {
  minW: number;
  maxW: number;
  minD: number;
  maxD: number;
  stories: number;
  wingChance: number;
  chimneys: number;
  yard: number;
}

export const PROGRAM_MASSING: readonly MassingRules[] = [
  { minW: 5, maxW: 7, minD: 5, maxD: 7, stories: 1, wingChance: 0, chimneys: 1, yard: 2 },
  { minW: 6, maxW: 9, minD: 6, maxD: 9, stories: 2, wingChance: 0, chimneys: 1, yard: 2 },
  { minW: 7, maxW: 10, minD: 6, maxD: 9, stories: 1, wingChance: 0.5, chimneys: 2, yard: 3 },
  { minW: 9, maxW: 13, minD: 8, maxD: 11, stories: 2, wingChance: 0.7, chimneys: 2, yard: 3 },
  { minW: 11, maxW: 15, minD: 9, maxD: 12, stories: 2, wingChance: 0.5, chimneys: 1, yard: 4 },
];

export const MAX_WING_SIDE = 6;

export function programIndexOf(program: BuildingProgram): number {
  return BUILDING_PROGRAMS.indexOf(program);
}

export function programNameOf(program: number): BuildingProgram {
  return BUILDING_PROGRAMS[clampedProgram(program)]!;
}

export function massingRulesFor(program: number): MassingRules {
  return PROGRAM_MASSING[clampedProgram(program)]!;
}

export function clampedProgram(program: number): number {
  const rounded = Math.round(program);
  if (!Number.isFinite(rounded) || rounded < 0) return 0;
  return Math.min(BUILDING_PROGRAMS.length - 1, rounded);
}

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

export interface ProgramDef {
  name: string;
  massing: MassingRules;
  defaultWeight: number;
  ringHome: number;
  minTownAge: number;
}

export const ANY_RING = -1;

export const PROGRAM_CATALOG: readonly ProgramDef[] = [
  {
    name: 'cottage',
    massing: { minW: 5, maxW: 7, minD: 5, maxD: 7, stories: 1, wingChance: 0, chimneys: 1, yard: 2 },
    defaultWeight: 4,
    ringHome: ANY_RING,
    minTownAge: 0,
  },
  {
    name: 'dwelling',
    massing: { minW: 6, maxW: 9, minD: 6, maxD: 9, stories: 2, wingChance: 0, chimneys: 1, yard: 2 },
    defaultWeight: 3,
    ringHome: ANY_RING,
    minTownAge: 1,
  },
  {
    name: 'smithy',
    massing: { minW: 7, maxW: 10, minD: 6, maxD: 9, stories: 1, wingChance: 0.5, chimneys: 2, yard: 3 },
    defaultWeight: 2,
    ringHome: 2,
    minTownAge: 2,
  },
  {
    name: 'inn',
    massing: { minW: 9, maxW: 13, minD: 8, maxD: 11, stories: 2, wingChance: 0.7, chimneys: 2, yard: 3 },
    defaultWeight: 1,
    ringHome: 1,
    minTownAge: 3,
  },
  {
    name: 'townHall',
    massing: { minW: 11, maxW: 15, minD: 9, maxD: 12, stories: 2, wingChance: 0.5, chimneys: 1, yard: 4 },
    defaultWeight: 1,
    ringHome: 0,
    minTownAge: 4,
  },
  {
    name: 'miningCamp',
    massing: { minW: 5, maxW: 8, minD: 4, maxD: 7, stories: 1, wingChance: 0.3, chimneys: 2, yard: 3 },
    defaultWeight: 0,
    ringHome: ANY_RING,
    minTownAge: 0,
  },
];

export function programIndexByName(name: string): number {
  const index = PROGRAM_CATALOG.findIndex((def) => def.name === name);
  if (index < 0) throw new Error(`unknown building program: ${name}`);
  return index;
}

export function programDefOf(program: number): ProgramDef {
  return PROGRAM_CATALOG[clampedProgram(program)]!;
}

export function clampedProgram(program: number): number {
  const rounded = Math.round(program);
  if (!Number.isFinite(rounded) || rounded < 0) return 0;
  return Math.min(PROGRAM_CATALOG.length - 1, rounded);
}

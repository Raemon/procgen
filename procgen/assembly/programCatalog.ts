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

export const PROGRAM_CATALOG = [
  {
    name: 'cottage',
    massing: { minW: 5, maxW: 7, minD: 5, maxD: 7, stories: 1, wingChance: 0, chimneys: 1, yard: 2 },
    defaultWeight: 4,
    weightHelp: 'Relative share of outer plots that become cottages, the smallest single-story house.',
  },
  {
    name: 'dwelling',
    massing: { minW: 6, maxW: 9, minD: 6, maxD: 9, stories: 2, wingChance: 0, chimneys: 1, yard: 2 },
    defaultWeight: 3,
    weightHelp: 'Relative share of outer plots that become two-story dwellings.',
  },
  {
    name: 'smithy',
    massing: { minW: 7, maxW: 10, minD: 6, maxD: 9, stories: 1, wingChance: 0.5, chimneys: 2, yard: 3 },
    defaultWeight: 2,
    weightHelp: 'How many plots past the inns are given to smithies. 0 keeps smithies out of the village.',
  },
  {
    name: 'inn',
    massing: { minW: 9, maxW: 13, minD: 8, maxD: 11, stories: 2, wingChance: 0.7, chimneys: 2, yard: 3 },
    defaultWeight: 1,
    weightHelp: 'How many plots just off the plaza are given to inns. 0 keeps inns out of the village.',
  },
  {
    name: 'townHall',
    massing: { minW: 11, maxW: 15, minD: 9, maxD: 12, stories: 2, wingChance: 0.5, chimneys: 1, yard: 4 },
    defaultWeight: 1,
    weightHelp: 'Above 0 the plaza plot becomes the one town hall; at 0 it stays an ordinary house.',
  },
] as const;

export type ProgramDef = (typeof PROGRAM_CATALOG)[number];

export type ProgramName = ProgramDef['name'];

export function programIndexByName(name: ProgramName): number {
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

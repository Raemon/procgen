import { PROGRAM_CATALOG, programDefOf, type MassingRules } from './programCatalog';

export { clampedProgram, type MassingRules } from './programCatalog';

export const BUILDING_PROGRAMS: readonly string[] = PROGRAM_CATALOG.map((def) => def.name);

export type BuildingProgram = string;

export const PROGRAM_MASSING: readonly MassingRules[] = PROGRAM_CATALOG.map((def) => def.massing);

export const MAX_WING_SIDE = 6;

export function programIndexOf(program: BuildingProgram): number {
  return BUILDING_PROGRAMS.indexOf(program);
}

export function programNameOf(program: number): BuildingProgram {
  return programDefOf(program).name;
}

export function massingRulesFor(program: number): MassingRules {
  return programDefOf(program).massing;
}

import { PROGRAM_CATALOG, programDefOf, type MassingRules, type ProgramName } from './programCatalog';

export { clampedProgram, type MassingRules } from './programCatalog';

export const BUILDING_PROGRAMS: readonly ProgramName[] = PROGRAM_CATALOG.map((def) => def.name);

export type BuildingProgram = ProgramName;

export const MAX_WING_SIDE = 6;

export function programNameOf(program: number): BuildingProgram {
  return programDefOf(program).name;
}

export function massingRulesFor(program: number): MassingRules {
  return programDefOf(program).massing;
}

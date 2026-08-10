import {
  buildingPointOf,
  buildingSeedKeyAt,
  specOfBuildingPoint,
} from '../procgen/assembly/buildingPoint';
import {
  PROGRAM_CATALOG,
  programIndexByName,
  type ProgramName,
} from '../procgen/assembly/programCatalog';
import { nodeTypeOf } from '../procgen/nodeRegistry';
import { isKnobParamSpec, type KnobParamSpec } from '../procgen/nodeType';
import { weightKnobName } from '../procgen/nodes/village/programWeightKnobs';
import { VILLAGE_LAYOUT_PARAMS } from '../procgen/nodes/village/villageLayoutParams';
import type { CheckReporter } from './checkReporter';
import '../procgen/nodes';

const largestPlot = largestPlotCells();

function largestPlotCells(): number {
  const spec: KnobParamSpec | undefined = VILLAGE_LAYOUT_PARAMS.plotCells;
  return spec?.kind === 'int' ? spec.max : 0;
}

const SHIPPED_PLOT = 16;

function helpNamesItsProgram(name: ProgramName): boolean {
  const help = weightKnobOf(name)?.help ?? '';
  return help.length > 20 && help.toLowerCase().includes(spokenOf(name));
}

function spokenOf(name: ProgramName): string {
  return PROGRAM_CATALOG.find((def) => def.name === name)!.spokenName;
}

function ageLadderClimbsWithSize(): boolean {
  const byFloor = [...PROGRAM_CATALOG].sort((a, b) => footprintOf(a) - footprintOf(b));
  return byFloor.every((def, index) => index === 0 || def.minTownAge >= byFloor[index - 1]!.minTownAge);
}

function footprintOf(def: (typeof PROGRAM_CATALOG)[number]): number {
  return def.massing.maxW * def.massing.maxD;
}

export function checkProgramCatalog(check: CheckReporter): void {
  check(
    'every catalog program has a name unique in the catalog',
    new Set(PROGRAM_CATALOG.map((def) => def.name)).size === PROGRAM_CATALOG.length,
  );
  check(
    'every catalog massing fits inside the largest plot a village can be given',
    PROGRAM_CATALOG.every((def) => def.massing.maxW <= largestPlot && def.massing.maxD <= largestPlot),
  );
  check(
    'the catalog order and default weights are frozen, since saved worlds store program indices',
    PROGRAM_CATALOG.map((def) => def.name).join() === 'cottage,dwelling,smithy,inn,townHall' &&
      PROGRAM_CATALOG.map((def) => def.defaultWeight).join() === '4,3,2,1,1',
  );
  check(
    'every program the plot selector can choose has a weight knob whose help names that program',
    SELECTABLE_PROGRAMS.every((name) => helpNamesItsProgram(name)),
  );
  check(
    'a town has to be old enough for each larger program, so age is what makes a town look grown',
    ageLadderClimbsWithSize(),
  );
  check(
    'every catalog program fits the plot the shipped world actually lays out, halls included',
    PROGRAM_CATALOG.every((def) => def.massing.maxW <= SHIPPED_PLOT && def.massing.maxD <= SHIPPED_PLOT),
  );
  check(
    'a point still carrying the retired bld tag builds a default cottage rather than a town hall',
    specOfBuildingPoint({ x: 3, y: 4, tag: 'bld:4:2' }).program === 0,
  );
  check(
    'a building point round-trips every catalog program and facing',
    PROGRAM_CATALOG.every((_, program) =>
      [0, 1, 2, 3].every((facing) => roundTrips(program, facing)),
    ),
  );
  check(
    'programIndexByName finds every program in the catalog',
    PROGRAM_CATALOG.every((def, index) => programIndexByName(def.name) === index),
  );
}

const SELECTABLE_PROGRAMS = ['cottage', 'dwelling', 'smithy', 'inn', 'townHall'] as const;

function weightKnobOf(name: string): KnobParamSpec | undefined {
  const spec = nodeTypeOf('villagePlots')?.params[weightKnobName(name)];
  return spec && isKnobParamSpec(spec) ? spec : undefined;
}

function roundTrips(program: number, facing: number): boolean {
  const spec = { x: 5, y: 9, program, facing, seedKey: buildingSeedKeyAt(5, 9) };
  return JSON.stringify(specOfBuildingPoint(buildingPointOf(spec))) === JSON.stringify(spec);
}


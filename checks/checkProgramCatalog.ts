import {
  buildingPointOf,
  buildingSeedKeyAt,
  specOfBuildingPoint,
} from '../procgen/assembly/buildingPoint';
import { PROGRAM_CATALOG, programIndexByName } from '../procgen/assembly/programCatalog';
import { nodeTypeOf } from '../procgen/nodeRegistry';
import { weightKnobName } from '../procgen/nodes/village/programWeightKnobs';
import type { CheckReporter } from './checkReporter';
import '../procgen/nodes';

export function checkProgramCatalog(check: CheckReporter): void {
  check(
    'every catalog program has a name unique in the catalog',
    new Set(PROGRAM_CATALOG.map((def) => def.name)).size === PROGRAM_CATALOG.length,
  );
  check(
    'every catalog massing fits inside some legal plot size',
    PROGRAM_CATALOG.every((def) => def.massing.maxW <= 24 && def.massing.maxD <= 24),
  );
  check(
    'the village plots node offers one weight knob per catalog program',
    PROGRAM_CATALOG.every(
      (def) => weightKnobName(def.name) in (nodeTypeOf('villagePlots')?.params ?? {}),
    ),
  );
  check(
    'a building point round-trips every catalog program and facing',
    PROGRAM_CATALOG.every((_, program) =>
      [0, 1, 2, 3].every((facing) => roundTrips(program, facing)),
    ),
  );
  check(
    'programIndexByName finds every program and rejects unknown names',
    PROGRAM_CATALOG.every((def, index) => programIndexByName(def.name) === index) &&
      throws(() => programIndexByName('cathedral')),
  );
}

function roundTrips(program: number, facing: number): boolean {
  const spec = { x: 5, y: 9, program, facing, seedKey: buildingSeedKeyAt(5, 9) };
  return JSON.stringify(specOfBuildingPoint(buildingPointOf(spec))) === JSON.stringify(spec);
}

function throws(run: () => void): boolean {
  try {
    run();
    return false;
  } catch {
    return true;
  }
}

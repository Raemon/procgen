import {
  cloneCorridorMazeState,
  fixtureTileAssets,
  openPlainState,
  samplerOfState,
  variedStructuredState,
} from '@/features/asset-library/worlds/__tests__/walkingSimFixtures';
import { measureWalkingSimFun } from '@/features/asset-library/worlds/walkingSim/measureWalkingSimFun';
import { touristLimits } from '@/features/asset-library/worlds/walkingSim/touristWalk';

const CALIBRATION_LIMITS = touristLimits(400, 120);
const CALIBRATION_WALK_SEED = 7;

const calibrationWorlds = [
  { name: 'open plain', state: openPlainState() },
  { name: 'clone corridor maze', state: cloneCorridorMazeState() },
  { name: 'varied structured', state: variedStructuredState() },
];

for (const world of calibrationWorlds) printCalibration(world.name, world.state);

function printCalibration(name: string, state: ReturnType<typeof openPlainState>): void {
  const result = measureWalkingSimFun(
    samplerOfState(state),
    fixtureTileAssets,
    CALIBRATION_LIMITS,
    CALIBRATION_WALK_SEED,
  );
  if (!result) {
    console.log(`\n=== ${name}: nowhere to spawn`);
    return;
  }
  console.log(`\n=== ${name}  fun ${result.score.overall.toFixed(3)}  ${walkShapeLine(result)}`);
  for (const reading of result.score.readings) console.log(readingLine(reading));
}

function walkShapeLine(result: { measurements: { stepsWalked: number; cellsSeen: number } }): string {
  return `${result.measurements.stepsWalked} steps  ${result.measurements.cellsSeen} cells seen`;
}

function readingLine(reading: { name: string; value: number; score: number }): string {
  return `  ${reading.name.padEnd(26)}${reading.value.toFixed(3).padStart(9)}  ${reading.score.toFixed(2)}`;
}

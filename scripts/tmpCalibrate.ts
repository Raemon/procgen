import {
  cloneCorridorMazeState,
  fixtureTileAssets,
  openPlainState,
  samplerOfState,
  variedStructuredState,
} from '@/features/asset-library/worlds/__tests__/walkingSimFixtures';
import { measureWalkingSimFun } from '@/features/asset-library/worlds/walkingSim/measureWalkingSimFun';
import { touristLimits } from '@/features/asset-library/worlds/walkingSim/touristWalk';

const limits = touristLimits(400, 120);
const named = [
  { name: 'open plain', state: openPlainState() },
  { name: 'clone maze', state: cloneCorridorMazeState() },
  { name: 'varied', state: variedStructuredState() },
];

for (const each of named) {
  const started = Date.now();
  const sampler = samplerOfState(each.state);
  const shares = new Map<number, number>();
  for (let y = -60; y < 60; y++) {
    for (let x = -60; x < 60; x++) {
      const id = sampler.tileAt(x, y);
      shares.set(id, (shares.get(id) ?? 0) + 1);
    }
  }
  console.log(`\n=== ${each.name} tiles`, [...shares].sort((a, b) => a[0] - b[0]).map(([id, n]) => `${id}:${(n / 14400).toFixed(2)}`).join(' '));
  const result = measureWalkingSimFun(sampler, fixtureTileAssets, limits, 7);
  if (!result) {
    console.log(each.name, 'no spawn');
    continue;
  }
  console.log(`score ${result.score.overall.toFixed(3)} in ${Date.now() - started}ms  seen ${result.measurements.cellsSeen} steps ${result.measurements.stepsWalked} exhausted ${result.measurements.exhaustedRegion}`);
  for (const reading of result.score.readings) {
    console.log(`  ${reading.name.padEnd(24)} ${reading.value.toFixed(3).padStart(8)}  ${reading.score.toFixed(2)}`);
  }
}

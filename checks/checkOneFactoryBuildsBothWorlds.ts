import { currentServerWorld } from '../api/agent/persistedServerWorld';
import type { ServerWorld } from '../api/agent/serverWorld';
import { earthlikeWorld, storedJsonOfAnEarthlikeWorld } from './agentDriverFixtures';
import type { CheckReporter } from './checkReporter';

const SAMPLED_SPAN = 24;

export function checkOneFactoryBuildsBothWorlds(check: CheckReporter): void {
  const read = storedJsonOfAnEarthlikeWorld();
  const served = currentServerWorld({ read: (name) => read(name), stamp: () => 'stored' }, null);
  const headless = earthlikeWorld();
  check(
    'the same stored json yields the same terrain and spawn served or headless, so an offline measurement is of the world a player walks',
    sampledTerrainOf(served) === sampledTerrainOf(headless) &&
      JSON.stringify(served.spawn()) === JSON.stringify(headless.spawn()),
  );
}

function sampledTerrainOf(world: ServerWorld): string {
  const ids: number[] = [];
  for (let y = -SAMPLED_SPAN; y <= SAMPLED_SPAN; y += 3) {
    for (let x = -SAMPLED_SPAN; x <= SAMPLED_SPAN; x += 3) ids.push(world.sampler.tileAt(x, y));
  }
  return ids.join(',');
}

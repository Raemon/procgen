import { exploreFromSpawn } from '../explorerWalk';
import type { WorldDriver } from './worldDriver';

export const EXPLORER_WALK_DRIVER_NAME = 'explorer';

export const explorerWalkDriver: WorldDriver = {
  name: EXPLORER_WALK_DRIVER_NAME,
  explore: (run) => Promise.resolve(exploreFromSpawn(run.isWalkableAt, run.spawn, run.limits)),
};

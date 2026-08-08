import { agentDriver } from '../tools/explore/drivers/agentDriver';
import { scriptedExplorerPolicy } from '../tools/explore/drivers/scriptedExplorerPolicy';
import type { WorldDriver } from '../tools/explore/drivers/worldDriver';
import { measureWorld } from '../tools/explore/metrics/measureWorld';
import {
  AGENT_WALK_LIMITS,
  earthlikeWorld,
  pathOf,
  traceOfSeededPolicy,
} from './agentDriverFixtures';
import type { CheckReporter } from './checkReporter';

const BATCH_SEEDS = [11, 12, 14];

export async function checkAgentDriverIsReproducible(check: CheckReporter): Promise<void> {
  await checkASeedIsWhatDrivesTheWalk(check);
  await checkAWorldMeasuresTheSameAloneAsInABatch(check);
}

async function checkASeedIsWhatDrivesTheWalk(check: CheckReporter): Promise<void> {
  const first = pathOf(await traceOfSeededPolicy(scriptedExplorerPolicy, 7));
  const repeated = pathOf(await traceOfSeededPolicy(scriptedExplorerPolicy, 7));
  const elsewhere = pathOf(await traceOfSeededPolicy(scriptedExplorerPolicy, 99));
  check(
    'a scripted agent run replays cell for cell from its seed, so a ranking can be reproduced',
    first === repeated,
  );
  check(
    'a different seed sends the scripted agent somewhere else, so the seed is what drives it',
    first !== elsewhere,
  );
}

async function checkAWorldMeasuresTheSameAloneAsInABatch(check: CheckReporter): Promise<void> {
  const driver = agentDriver(scriptedExplorerPolicy);
  const batch: string[] = [];
  for (const seed of BATCH_SEEDS) batch.push(await measuredPathOf(driver, seed));
  const lastSeed = BATCH_SEEDS[BATCH_SEEDS.length - 1]!;
  check(
    'a world walks the same trace measured alone as measured last in a batch, so nothing scores a world by what came before it',
    (await measuredPathOf(driver, lastSeed)) === batch[batch.length - 1],
  );
}

async function measuredPathOf(driver: WorldDriver, seed: number): Promise<string> {
  const result = await measureWorld(earthlikeWorld(seed), AGENT_WALK_LIMITS, driver, seed);
  return pathOf(result!.trace);
}

import { agentDriver, AGENT_DRIVER_NAME } from './agentDriver';
import { explorerWalkDriver, EXPLORER_WALK_DRIVER_NAME } from './explorerWalkDriver';
import { policyFromEnvironment } from './policyFromEnvironment';
import type { WorldDriver } from './worldDriver';

export function driverFromEnvironment(
  env: Record<string, string | undefined>,
  seed: number,
): WorldDriver {
  const asked = env.WORLD_DRIVER ?? EXPLORER_WALK_DRIVER_NAME;
  if (asked === EXPLORER_WALK_DRIVER_NAME) return explorerWalkDriver;
  if (asked === AGENT_DRIVER_NAME) return agentDriver(policyFromEnvironment(env, seed));
  throw new Error(
    `WORLD_DRIVER='${asked}' is not a driver: use '${EXPLORER_WALK_DRIVER_NAME}' or '${AGENT_DRIVER_NAME}'`,
  );
}

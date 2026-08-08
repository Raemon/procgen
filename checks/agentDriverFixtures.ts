import { readFileSync } from 'node:fs';
import { headlessServerWorld } from '../api/agent/headless/headlessServerWorld';
import type { ServerWorld } from '../api/agent/serverWorld';
import type { StoredWorldJson } from '../api/agent/serverWorldAssets';
import { agentDriver } from '../tools/explore/drivers/agentDriver';
import type { AgentPolicy, SeededAgentPolicy } from '../tools/explore/drivers/agentPolicy';
import { cachedTileIdProbe, walkableProbeFrom } from '../tools/explore/cachedWorldProbes';
import type { ExplorationTrace } from '../tools/explore/explorationTrace';
import { spawnNearOrigin } from '../tools/explore/spawnPoint';
import { earthlikeState } from './pipelineWorldFixtures';

export const AGENT_WALK_LIMITS = { stepBudget: 150, radiusCap: 60 };

export function storedJsonOfAnEarthlikeWorld(seed?: number): StoredWorldJson {
  const tiles: unknown = JSON.parse(readFileSync('data/tiles.json', 'utf8'));
  const pipeline = earthlikeState();
  const state = seed === undefined ? pipeline : { ...pipeline, seed };
  return (name) => {
    if (name === 'tiles') return tiles;
    if (name === 'pipeline') return state;
    return null;
  };
}

export function earthlikeWorld(seed?: number): ServerWorld {
  return headlessServerWorld(storedJsonOfAnEarthlikeWorld(seed));
}

export function traceOfPolicy(policy: AgentPolicy): Promise<ExplorationTrace> {
  return traceOfSeededPolicy({ name: policy.name, forSeed: () => policy }, 1);
}

export function traceOfSeededPolicy(
  policy: SeededAgentPolicy,
  seed: number,
): Promise<ExplorationTrace> {
  const world = earthlikeWorld();
  const isWalkableAt = walkableProbeFrom(cachedTileIdProbe(world.sampler), world.tileAssets);
  const spawn = spawnNearOrigin(isWalkableAt)!;
  return agentDriver(policy).explore({
    world,
    spawn,
    isWalkableAt,
    limits: AGENT_WALK_LIMITS,
    seed,
  });
}

export function pathOf(trace: ExplorationTrace): string {
  return trace.path.map((cell) => `${cell.x},${cell.y}`).join(' ');
}

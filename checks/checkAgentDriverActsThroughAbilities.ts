import type { AgentPolicy } from '../tools/explore/drivers/agentPolicy';
import { scriptedExplorerPolicy } from '../tools/explore/drivers/scriptedExplorerPolicy';
import type { ExplorationTrace } from '../tools/explore/explorationTrace';
import { earthlikeWorld, traceOfPolicy, traceOfSeededPolicy } from './agentDriverFixtures';
import type { CheckReporter } from './checkReporter';

export async function checkAgentDriverActsThroughAbilities(check: CheckReporter): Promise<void> {
  const walked = await traceOfSeededPolicy(scriptedExplorerPolicy, 7);
  check(
    'the agent only ever stands one tile from where it stood, because it moves by taking steps',
    everyStepIsOneTile(walked),
  );
  check(
    'every cell the agent reaches is one the world calls walkable, so no driver walks through walls',
    everyCellIsWalkable(walked),
  );
  const madeUp = await traceOfPolicy(inventedActionPolicy());
  check(
    'an action no ability registers moves the agent nowhere, so the ability layer is what carries a driver',
    madeUp.path.every((cell) => cell.x === madeUp.spawn.x && cell.y === madeUp.spawn.y),
  );
}

function inventedActionPolicy(): AgentPolicy {
  return {
    name: 'invented',
    decide: () => Promise.resolve({ action: 'teleport_to_the_best_bit', params: {} }),
  };
}

function everyStepIsOneTile(trace: ExplorationTrace): boolean {
  return trace.path.every((cell, index) => {
    const previous = trace.path[index - 1] ?? cell;
    return Math.max(Math.abs(cell.x - previous.x), Math.abs(cell.y - previous.y)) <= 1;
  });
}

function everyCellIsWalkable(trace: ExplorationTrace): boolean {
  const world = earthlikeWorld();
  return trace.path.every((cell) => world.isWalkable(cell.x, cell.y));
}

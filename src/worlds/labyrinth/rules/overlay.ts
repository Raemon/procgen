import { WALK_CLIMB_LIMIT } from '@/features/game/climbing';
import {
  STEP_ALLOWED,
  climbRefusal,
  obstacleRefusal,
  rulesWithDefaults,
  stepRefused,
  type AttachContext,
  type DefaultRules,
  type MineSlots,
  type StepAttempt,
  type StepVerdict,
  type WorldRules,
} from '@/features/game/worldRules';
import { LABYRINTH_NODE_TYPE } from '../node/labyrinthKnobs';
import { pocketKeys, purseSpendingLabyrinthKeysFirst } from './keysCarried';
import { PuzzleWorld } from './puzzleWorld';
import { sanitizePuzzleSnapshot } from './state/puzzleSnapshot';
import { PuzzleState } from './state/puzzleState';

export type { LabyrinthMine } from './keysCarried';

export interface LabyrinthRules extends WorldRules {
  puzzles: PuzzleWorld;
}

export function describeLabyrinthState(state: unknown): string {
  const held = sanitizePuzzleSnapshot(state);
  return `${held.on.length} fixtures worked, ${held.crates.length} crates moved`;
}

export function labyrinthRules(context: AttachContext): LabyrinthRules {
  const nodeId = context.node.id;
  const puzzles = new PuzzleWorld(context.store, nodeId, context.tileIsWalkable, new PuzzleState(), context.items);
  return {
    ...rulesWithDefaults({
      nodeId,
      nodeType: LABYRINTH_NODE_TYPE,
      owns: () => puzzles.isActive(),
      initialMine: () => ({ keys: 0 }),
      blocksAt: (x, y) => puzzles.blocksAt(x, y),
      step: (attempt, mine, defaults) => stepThroughTheRoom(puzzles, nodeId, attempt, mine, defaults),
      markersIn: (minX, minY, maxX, maxY) => puzzles.markersIn(minX, minY, maxX, maxY),
      circuitsIn: (minX, minY, maxX, maxY) => puzzles.circuitsIn(minX, minY, maxX, maxY),
      cratesIn: (minX, minY, maxX, maxY) => puzzles.cratesIn(minX, minY, maxX, maxY),
      actionAt: (x, y) => puzzles.actionAt(x, y),
      use: (x, y, mine, purse) => puzzles.use(x, y, purseSpendingLabyrinthKeysFirst(mine, nodeId, purse)),
      resetRoomAt: (x, y) => describeResetRoom(puzzles, x, y),
      items: puzzles,
      revision: () => puzzles.state.revision(),
      snapshot: () => puzzles.state.snapshot(),
      applySnapshot: (raw) => {
        if (raw === null || raw === undefined) puzzles.state.forgetAll();
        else puzzles.state.replaceAll(sanitizePuzzleSnapshot(raw));
      },
    }),
    puzzles,
  };
}

function stepThroughTheRoom(
  puzzles: PuzzleWorld,
  nodeId: string,
  attempt: StepAttempt,
  mine: MineSlots,
  defaults: DefaultRules,
): StepVerdict {
  const { from, to, dx, dy, mayPush, commit } = attempt;
  const tooSteep = climbRefusal(defaults.surfaceAt, from, to, WALK_CLIMB_LIMIT, 'a step');
  if (tooSteep) return stepRefused(tooSteep);
  const clear = commit
    ? puzzles.clearTheWay(to.x, to.y, dx, dy, mayPush)
    : puzzles.couldClearTheWay(to.x, to.y, dx, dy, mayPush);
  if (!clear) return stepRefused(obstacleRefusal(to));
  if (!defaults.tileIsWalkable(to.x, to.y)) return stepRefused(`the ground at (${to.x},${to.y}) blocks you`);
  if (commit) pocketKeys(mine, nodeId, puzzles.takeKeysAt(to.x, to.y).length);
  return STEP_ALLOWED;
}

function describeResetRoom(puzzles: PuzzleWorld, x: number, y: number): string | null {
  const layout = puzzles.resetRoomAt(x, y);
  return layout ? `the ${layout.kindName || 'empty'} chamber at ${layout.key}` : null;
}

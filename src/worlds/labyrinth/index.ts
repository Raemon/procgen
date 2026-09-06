import { LABYRINTH_NODE_TYPE } from '@/features/asset-library/worlds/labyrinth/labyrinthKnobs';
import { WALK_CLIMB_LIMIT } from '@/features/game/climbing';
import type { KeyPurse } from '@/features/game/fixtures/keyPurse';
import {
  STEP_ALLOWED,
  climbRefusal,
  obstacleRefusal,
  registerWorldRules,
  rulesWithDefaults,
  stepRefused,
  type AttachContext,
  type MineSlots,
  type WorldRules,
} from '@/features/game/worldRules';
import { PuzzleWorld } from './puzzles/puzzleWorld';
import { sanitizePuzzleSnapshot } from './puzzles/state/puzzleSnapshot';
import { PuzzleState } from './puzzles/state/puzzleState';

export interface LabyrinthMine {
  keys: number;
}

export interface LabyrinthRules extends WorldRules {
  puzzles: PuzzleWorld;
}

registerWorldRules({ nodeType: LABYRINTH_NODE_TYPE, attach: labyrinthRules, describe: describeLabyrinthState });

export function describeLabyrinthState(state: unknown): string {
  const held = sanitizePuzzleSnapshot(state);
  return `${held.on.length} fixtures worked, ${held.crates.length} crates moved`;
}

export function labyrinthRules(context: AttachContext): LabyrinthRules {
  const nodeId = context.node.id;
  const puzzles = new PuzzleWorld(context.store, nodeId, context.tileIsWalkable, new PuzzleState(), context.items);
  const keysOf = (mine: MineSlots): number => (mine.get(nodeId) as LabyrinthMine | null)?.keys ?? 0;
  const purseOf = (mine: MineSlots, purse: KeyPurse): KeyPurse => ({
    spendKey: () => {
      const keys = keysOf(mine);
      if (keys > 0) {
        mine.set(nodeId, { keys: keys - 1 });
        return true;
      }
      return purse.spendKey();
    },
  });
  return {
    ...rulesWithDefaults({
      nodeId,
      nodeType: LABYRINTH_NODE_TYPE,
      owns: () => puzzles.isActive(),
      initialMine: () => ({ keys: 0 }),
      blocksAt: (x, y) => puzzles.blocksAt(x, y),
      step: (attempt, mine, defaults) => {
        const { from, to, dx, dy, mayPush, commit } = attempt;
        const tooSteep = climbRefusal(defaults.surfaceAt, from, to, WALK_CLIMB_LIMIT, 'a step');
        if (tooSteep) return stepRefused(tooSteep);
        const clear = commit
          ? puzzles.clearTheWay(to.x, to.y, dx, dy, mayPush)
          : puzzles.couldClearTheWay(to.x, to.y, dx, dy, mayPush);
        if (!clear) return stepRefused(obstacleRefusal(to));
        if (!defaults.tileIsWalkable(to.x, to.y)) return stepRefused(`the ground at (${to.x},${to.y}) blocks you`);
        if (commit) {
          const taken = puzzles.takeKeysAt(to.x, to.y).length;
          if (taken > 0) mine.set(nodeId, { keys: keysOf(mine) + taken });
        }
        return STEP_ALLOWED;
      },
      markersIn: (minX, minY, maxX, maxY) => puzzles.markersIn(minX, minY, maxX, maxY),
      actionAt: (x, y) => puzzles.actionAt(x, y),
      use: (x, y, mine, purse) => puzzles.use(x, y, purseOf(mine, purse)),
      resetRoomAt: (x, y) => {
        const layout = puzzles.resetRoomAt(x, y);
        return layout ? `the ${layout.kindName || 'empty'} chamber at ${layout.key}` : null;
      },
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

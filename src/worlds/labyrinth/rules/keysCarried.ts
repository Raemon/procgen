import type { KeyPurse } from '@/features/game/fixtures/keyPurse';
import type { MineSlots } from '@/features/game/worldRules';

export interface LabyrinthMine {
  keys: number;
}

export function keysCarried(mine: MineSlots, nodeId: string): number {
  return (mine.get(nodeId) as LabyrinthMine | null)?.keys ?? 0;
}

export function pocketKeys(mine: MineSlots, nodeId: string, taken: number): void {
  if (taken <= 0) return;
  mine.set(nodeId, { keys: keysCarried(mine, nodeId) + taken });
}

export function purseSpendingLabyrinthKeysFirst(
  mine: MineSlots,
  nodeId: string,
  elsewhere: KeyPurse,
): KeyPurse {
  return {
    spendKey: () => {
      const carried = keysCarried(mine, nodeId);
      if (carried === 0) return elsewhere.spendKey();
      mine.set(nodeId, { keys: carried - 1 });
      return true;
    },
  };
}

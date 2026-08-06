import type { QuestInventory } from './questInventory';
import type { QuestPointsIndex } from './questPointsIndex';
import { doorIdOfTag, keyIdOfTag } from './questTags';

export type WalkProbe = (x: number, y: number) => boolean;

export function lockedDoorIdAt(
  index: QuestPointsIndex,
  inventory: QuestInventory,
  x: number,
  y: number,
): string | null {
  for (const tag of index.tagsAt(x, y)) {
    const doorId = doorIdOfTag(tag);
    if (doorId !== null && !inventory.has(doorId)) return doorId;
  }
  return null;
}

export function doorIdAt(index: QuestPointsIndex, x: number, y: number): string | null {
  for (const tag of index.tagsAt(x, y)) {
    const doorId = doorIdOfTag(tag);
    if (doorId !== null) return doorId;
  }
  return null;
}

export function collectKeysAt(
  index: QuestPointsIndex,
  inventory: QuestInventory,
  x: number,
  y: number,
): string[] {
  const collected: string[] = [];
  for (const tag of index.tagsAt(x, y)) {
    const keyId = keyIdOfTag(tag);
    if (keyId !== null && inventory.collect(keyId)) collected.push(keyId);
  }
  return collected;
}

export function questWalkability(
  base: WalkProbe,
  index: QuestPointsIndex,
  inventory: QuestInventory,
): WalkProbe {
  return (x, y) => base(x, y) && lockedDoorIdAt(index, inventory, x, y) === null;
}

export function creatureWalkability(base: WalkProbe, index: QuestPointsIndex): WalkProbe {
  return (x, y) => base(x, y) && doorIdAt(index, x, y) === null;
}

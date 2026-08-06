import type { CreatureQuestHooks } from '../creatures/sim/creatureSim';
import type { QuestInventory } from './questInventory';
import { keyIdOfTag } from './questTags';

export function questCreatureHooks(inventory: QuestInventory): CreatureQuestHooks {
  return {
    suppressSpawn: (tag) => isHeldKeyTag(inventory, tag),
    captureOnContact: (tag) => takeKeyFromKeeper(inventory, tag),
  };
}

function isHeldKeyTag(inventory: QuestInventory, tag: string): boolean {
  const keyId = keyIdOfTag(tag);
  return keyId !== null && inventory.has(keyId);
}

function takeKeyFromKeeper(inventory: QuestInventory, tag: string): boolean {
  const keyId = keyIdOfTag(tag);
  if (keyId === null) return false;
  inventory.collect(keyId);
  return true;
}

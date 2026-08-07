import type { CreatureLibrary } from '../../creatures/creatureLibrary';
import { playerCharacterDef } from '../../characters/playerCharacter';
import type { ItemSpawn } from '../../../procgen/worldSampler';
import { firstOpenPlacement } from '../inventory/firstOpenPlacement';
import { withItemPlaced } from '../inventory/inventoryPlacement';
import type { ItemLibrary } from '../itemLibrary';
import type { GroundItems } from './groundItems';

export interface StowDeps {
  creatures: CreatureLibrary;
  items: ItemLibrary;
  groundItems: GroundItems;
}

export type StowOutcome =
  | { ok: true; itemName: string; slotX: number; slotY: number }
  | { ok: false; code: 'no_inventory' | 'placement_refused'; hint: string };

export function stowSpawnedItem(deps: StowDeps, spawn: ItemSpawn): StowOutcome {
  const carrier = playerCharacterDef(deps.creatures);
  const item = deps.items.byId(spawn.itemId);
  if (!carrier?.inventory || !item) {
    return { ok: false, code: 'no_inventory', hint: 'the player character has no bag to put an item in' };
  }
  const slot = firstOpenPlacement(carrier.inventory, deps.items, item);
  if (!slot) {
    return { ok: false, code: 'placement_refused', hint: `no free slot in the bag fits ${item.name}` };
  }
  deps.creatures.update(carrier.id, {
    inventory: withItemPlaced(carrier.inventory, item, slot.x, slot.y),
  });
  deps.groundItems.take(spawn);
  return { ok: true, itemName: item.name, slotX: slot.x, slotY: slot.y };
}

export function stowEverythingOnTile(
  deps: StowDeps,
  x: number,
  y: number,
): { taken: string[]; refused: string[] } {
  const taken: string[] = [];
  const refused: string[] = [];
  for (const spawn of deps.groundItems.at(x, y)) {
    const outcome = stowSpawnedItem(deps, spawn);
    if (outcome.ok) taken.push(outcome.itemName);
    else refused.push(outcome.hint);
  }
  return { taken, refused };
}

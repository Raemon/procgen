import { playerCharacterDef } from '../creatures/playerCharacter';
import { firstOpenPlacement } from '../items/inventory/firstOpenPlacement';
import { withItemPlaced } from '../items/inventory/inventoryPlacement';
import type { ItemSpawn } from '../procgen/worldSampler';
import {
  abilityFailed,
  abilitySucceeded,
  type AbilityContext,
  type AbilityMode,
  type AbilityResult,
} from './ability';
import { registerAbility } from './abilityRegistry';

const PICK_UP_DESCRIPTION =
  'Pick up the item lying on the tile you stand on and put it in the player character\'s bag. Carrying an item that emits light lights the way wherever you walk.';

const PICK_UP_ACTIONS: readonly { action: string; mode: AbilityMode; humanControl: string }[] = [
  { action: 'pick_up_item', mode: 'god', humanControl: 'G, while driving the world camera' },
  { action: 'pick_up', mode: 'character', humanControl: 'G' },
];

for (const spec of PICK_UP_ACTIONS) {
  registerAbility({
    action: spec.action,
    mode: spec.mode,
    group: 'movement',
    humanControl: spec.humanControl,
    description: PICK_UP_DESCRIPTION,
    params: {},
    example: { action: spec.action },
    changesWorld: true,
    apply: (context) => pickUpItemUnderActor(context),
  });
}

function pickUpItemUnderActor(context: AbilityContext): AbilityResult {
  const pose = context.actor.pose();
  const spawn = context.groundItems.at(pose.x, pose.y)[0];
  if (!spawn) {
    return abilityFailed('nothing_to_pick_up', `no item lies at (${pose.x},${pose.y})`);
  }
  return stowSpawnedItem(context, spawn);
}

function stowSpawnedItem(context: AbilityContext, spawn: ItemSpawn): AbilityResult {
  const carrier = playerCharacterDef(context.creatures);
  const item = context.items.byId(spawn.itemId);
  if (!carrier?.inventory || !item) {
    return abilityFailed('no_inventory', 'the player character has no bag to put an item in');
  }
  const slot = firstOpenPlacement(carrier.inventory, context.items, item);
  if (!slot) {
    return abilityFailed('placement_refused', `no free slot in the bag fits ${item.name}`);
  }
  context.creatures.update(carrier.id, {
    inventory: withItemPlaced(carrier.inventory, item, slot.x, slot.y),
  });
  context.groundItems.take(spawn);
  return abilitySucceeded(`picked up ${item.name} into slot ${slot.x},${slot.y}`);
}

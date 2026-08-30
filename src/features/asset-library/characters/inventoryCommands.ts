import type { CreatureId } from '@/features/asset-library/asset';
import type { CreatureDef } from '@/features/asset-library/creatures/creatureDef';
import { CHARACTER } from '@/features/asset-library/creatures/entityKinds';
import {
  blankInventory,
  clampSide,
  isInsideInventory,
  resizedInventory,
  slotAt,
  withSlotAt,
  type InventoryDef,
} from '@/features/asset-library/items/inventory/inventoryDef';
import {
  placementCovering,
  placementRefusal,
  prunedPlacements,
  REFUSAL_HINTS,
  withItemPlaced,
  withoutPlacementCovering,
} from '@/features/asset-library/items/inventory/inventoryPlacement';
import {
  commandFailed,
  commandSucceeded,
  type CommandContext,
  type CommandResult,
  type CommandSpec,
  type CommandParams,
} from '@/features/app-shell/runtime/commands/command';
import { readInt } from '@/features/app-shell/runtime/commands/commandParams';
import { createCommandCollection } from '@/features/app-shell/runtime/commands/commandCollection';
import { withCreature } from '@/features/asset-library/creatures/creatureCommands';
import { spriteFrom, tagsFrom, withItem } from '@/features/asset-library/items/itemCommands';

const { define: registerCommand, commands: inventoryCommands } = createCommandCollection();
export { inventoryCommands };



const CREATURE_ID_HELP = 'id of an existing creature or character — see GET /api/v1/asset-library/creatures';
const SLOT_X_HELP = 'inventory column, 0 at the left';
const SLOT_Y_HELP = 'inventory row, 0 at the top';

function registerInventoryCommand(
  spec: Omit<CommandSpec, 'mode' | 'group' | 'changesWorld'>,
): CommandSpec {
  return registerCommand({ ...spec, mode: 'god', group: 'assets', changesWorld: true });
}

registerInventoryCommand({
  action: 'set_inventory',
  humanControl: 'detail panel, characters: the inventory width and height knobs',
  description:
    'Give a creature an inventory grid, or resize the one it has. Slots that survive a resize keep their usable flag and tags; items that no longer fit are dropped.',
  params: {
    creature_id: { kind: 'int', help: CREATURE_ID_HELP },
    width: { kind: 'int', help: 'columns, 1-16' },
    height: { kind: 'int', help: 'rows, 1-16' },
  },
  example: { action: 'set_inventory', creature_id: 7, width: 10, height: 4 },
  apply: (context, params) => setInventory(context, params),
});

registerInventoryCommand({
  action: 'clear_inventory',
  humanControl: 'detail panel, characters: remove inventory',
  description: 'Take the inventory grid away entirely, dropping its slots, tags and items.',
  params: { creature_id: { kind: 'int', help: CREATURE_ID_HELP } },
  example: { action: 'clear_inventory', creature_id: 7 },
  apply: (context, params) =>
    withCreature(context, params, (creatureId) => {
      context.creatures.update(creatureId, { inventory: null });
      return commandSucceeded(`creature ${creatureId} no longer has an inventory`);
    }),
});

registerInventoryCommand({
  action: 'update_inventory_slot',
  humanControl: 'detail panel, characters: click a slot in the inventory grid',
  description:
    'Mark one slot usable or dead, and set the tags that filter it. A slot with no tags accepts any item; a tagged slot only accepts items carrying one of its tags.',
  params: {
    creature_id: { kind: 'int', help: CREATURE_ID_HELP },
    slot_x: { kind: 'int', help: SLOT_X_HELP },
    slot_y: { kind: 'int', help: SLOT_Y_HELP },
    usable: { kind: 'int', help: '1 if items may sit here, 0 if the slot is dead', optional: true },
    tags: { kind: 'json', help: 'an array of tag strings, or [] to accept anything', optional: true },
  },
  example: { action: 'update_inventory_slot', creature_id: 7, slot_x: 0, slot_y: 0, tags: ['weapon'] },
  apply: (context, params) => updateSlot(context, params),
});

registerInventoryCommand({
  action: 'set_inventory_background',
  humanControl: 'detail panel, characters: the inventory backdrop art editor',
  description:
    'Layer pixel art under the whole inventory grid. The square sprite is stretched across the grid and the slots draw on top of it.',
  params: {
    creature_id: { kind: 'int', help: CREATURE_ID_HELP },
    sprite: {
      kind: 'json',
      help: 'a flat array of size*size "#rrggbb" strings and nulls, where null is transparent, or the compact {palette, pixels} form GET reports; or null to clear it',
    },
  },
  example: { action: 'set_inventory_background', creature_id: 7, sprite: null },
  apply: (context, params) => setBackground(context, params),
});

registerInventoryCommand({
  action: 'place_inventory_item',
  humanControl: 'detail panel, characters: pick an item, then click a slot',
  description:
    'Put an item in the grid with its top-left corner at that slot. It must fit inside the grid, cover only usable slots that accept its tags, and not overlap another item.',
  params: {
    creature_id: { kind: 'int', help: CREATURE_ID_HELP },
    item_id: { kind: 'int', help: 'id of an existing item — see GET /api/v1/asset-library/items' },
    slot_x: { kind: 'int', help: SLOT_X_HELP },
    slot_y: { kind: 'int', help: SLOT_Y_HELP },
  },
  example: { action: 'place_inventory_item', creature_id: 7, item_id: 1, slot_x: 0, slot_y: 0 },
  apply: (context, params) => placeItem(context, params),
});

registerInventoryCommand({
  action: 'remove_inventory_item',
  humanControl: 'detail panel, characters: click a placed item in the inventory grid',
  description: 'Take whichever item covers that slot back out of the grid.',
  params: {
    creature_id: { kind: 'int', help: CREATURE_ID_HELP },
    slot_x: { kind: 'int', help: SLOT_X_HELP },
    slot_y: { kind: 'int', help: SLOT_Y_HELP },
  },
  example: { action: 'remove_inventory_item', creature_id: 7, slot_x: 0, slot_y: 0 },
  apply: (context, params) => removeItem(context, params),
});

function setInventory(context: CommandContext, params: CommandParams): CommandResult {
  return withCreature(context, params, (creatureId) => {
    const width = readInt(params, 'width');
    if (!width.ok) return width.failure;
    const height = readInt(params, 'height');
    if (!height.ok) return height.failure;
    const existing = context.creatures.byId(creatureId)!.inventory;
    const resized = existing
      ? resizedInventory(existing, width.value, height.value)
      : blankInventory(width.value, height.value);
    context.creatures.update(creatureId, {
      inventory: prunedPlacements(resized, context.items),
      kind: CHARACTER,
    });
    return commandSucceeded(
      `creature ${creatureId} has a ${clampSide(width.value)}x${clampSide(height.value)} inventory`,
    );
  });
}

function updateSlot(context: CommandContext, params: CommandParams): CommandResult {
  return withSlot(context, params, (creatureId, inventory, x, y) => {
    const tags = tagsFrom(params);
    if (!tags.ok) return tags.failure;
    const usable = readInt(params, 'usable');
    const patched = withSlotAt(inventory, x, y, {
      ...(usable.ok ? { usable: usable.value !== 0 } : {}),
      ...(tags.value !== undefined ? { tags: tags.value } : {}),
    });
    saveInventory(context, creatureId, prunedPlacements(patched, context.items));
    return commandSucceeded(`slot ${x},${y} of creature ${creatureId} updated`);
  });
}

function setBackground(context: CommandContext, params: CommandParams): CommandResult {
  return withInventory(context, params, (creatureId, inventory) => {
    const sprite = spriteFrom(params);
    if (!sprite.ok) return sprite.failure;
    saveInventory(context, creatureId, { ...inventory, background: sprite.value ?? null });
    return commandSucceeded(
      sprite.value ? `inventory backdrop set for creature ${creatureId}` : `inventory backdrop cleared for creature ${creatureId}`,
    );
  });
}

function placeItem(context: CommandContext, params: CommandParams): CommandResult {
  return withSlot(context, params, (creatureId, inventory, x, y) =>
    withItem(context, params, (itemId) => {
      const item = context.items.byId(itemId)!;
      const refusal = placementRefusal(inventory, context.items, item, x, y);
      if (refusal) return commandFailed('placement_refused', REFUSAL_HINTS[refusal]);
      saveInventory(context, creatureId, withItemPlaced(inventory, item, x, y));
      return commandSucceeded(`placed item ${itemId} at ${x},${y} of creature ${creatureId}`);
    }),
  );
}

function removeItem(context: CommandContext, params: CommandParams): CommandResult {
  return withSlot(context, params, (creatureId, inventory, x, y) => {
    const covering = placementCovering(inventory, context.items, x, y);
    if (!covering) return commandFailed('placement_refused', `no item covers slot ${x},${y}`);
    saveInventory(context, creatureId, withoutPlacementCovering(inventory, context.items, x, y));
    return commandSucceeded(`removed item ${covering.itemId} from creature ${creatureId}`);
  });
}

function withInventory(
  context: CommandContext,
  params: CommandParams,
  use: (creatureId: CreatureId, inventory: InventoryDef) => CommandResult,
): CommandResult {
  return withCreature(context, params, (creatureId) => {
    const creature = context.creatures.byId(creatureId) as CreatureDef;
    if (!creature.inventory) {
      return commandFailed(
        'no_inventory',
        `creature ${creatureId} has no inventory — call set_inventory first`,
      );
    }
    return use(creatureId, creature.inventory);
  });
}

function withSlot(
  context: CommandContext,
  params: CommandParams,
  use: (creatureId: CreatureId, inventory: InventoryDef, x: number, y: number) => CommandResult,
): CommandResult {
  return withInventory(context, params, (creatureId, inventory) => {
    const x = readInt(params, 'slot_x');
    if (!x.ok) return x.failure;
    const y = readInt(params, 'slot_y');
    if (!y.ok) return y.failure;
    if (!isInsideInventory(inventory, x.value, y.value) || !slotAt(inventory, x.value, y.value)) {
      return commandFailed(
        'invalid_value',
        `slot_x must be 0-${inventory.width - 1} and slot_y 0-${inventory.height - 1}`,
      );
    }
    return use(creatureId, inventory, x.value, y.value);
  });
}

function saveInventory(
  context: CommandContext,
  creatureId: CreatureId,
  inventory: InventoryDef,
): void {
  context.creatures.update(creatureId, { inventory });
}

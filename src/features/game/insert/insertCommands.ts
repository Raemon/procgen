import type { DisplayBinding } from '@/features/asset-library/worlds/display/displayBinding';
import {
  commandFailed,
  commandSucceeded,
  type CommandContext,
  type CommandResult,
  type CommandParams,
} from '@/features/app-shell/runtime/commands/command';
import { createCommandCollection } from '@/features/app-shell/runtime/commands/commandCollection';
import { listOf, readAssetId } from '@/features/app-shell/runtime/commands/commandParams';
import { facingVector } from '../facing';

const { define: registerCommand, commands: insertCommands } = createCommandCollection();
export { insertCommands };

registerCommand({
  action: 'insert_item',
  mode: 'god',
  group: 'world',
  humanControl: 'library panel, item row: the insert arrow',
  description:
    'Drop one of this item into the running world on the tile directly ahead of the player, as a landmark point node the world keeps.',
  params: {
    item_id: { kind: 'int', help: 'an item id — see GET /api/v1/asset-library/items' },
  },
  example: { action: 'insert_item', item_id: 5 },
  changesWorld: true,
  apply: (context, params) => insertItemAhead(context, params),
});

registerCommand({
  action: 'insert_creature',
  mode: 'god',
  group: 'world',
  humanControl: 'library panel, creature row: the insert arrow',
  description:
    'Spawn one of this creature into the running world on the tile directly ahead of the player, as a landmark point node the world keeps.',
  params: {
    creature_id: { kind: 'int', help: 'a creature id — see GET /api/v1/asset-library/creatures' },
  },
  example: { action: 'insert_creature', creature_id: 0 },
  changesWorld: true,
  apply: (context, params) => insertCreatureAhead(context, params),
});

function insertItemAhead(
  context: CommandContext,
  params: CommandParams,
): CommandResult {
  const id = readAssetId<'items'>(params, 'item_id');
  if (!id.ok) return id.failure;
  const item = context.items.byId(id.value);
  if (!item) {
    return commandFailed(
      'invalid_value',
      `item_id must be one of: ${listOf(context.items.all().map((each) => each.id))} — see GET /api/v1/asset-library/items`,
    );
  }
  return placeLandmarkAhead(context, item.name, { mode: 'items', itemId: item.id });
}

function insertCreatureAhead(
  context: CommandContext,
  params: CommandParams,
): CommandResult {
  const id = readAssetId<'creatures'>(params, 'creature_id');
  if (!id.ok) return id.failure;
  const creature = context.creatures.byId(id.value);
  if (!creature) {
    return commandFailed(
      'invalid_value',
      `creature_id must be one of: ${listOf(context.creatures.all().map((each) => each.id))} — see GET /api/v1/asset-library/creatures`,
    );
  }
  return placeLandmarkAhead(context, creature.name, { mode: 'creatures', creatureId: creature.id });
}

function placeLandmarkAhead(
  context: CommandContext,
  name: string,
  binding: DisplayBinding,
): CommandResult {
  const pose = context.actor.pose();
  const ahead = facingVector(pose.facing);
  const x = pose.x + ahead.dx;
  const y = pose.y + ahead.dy;
  const node = context.store.addNode('landmarkPoint');
  if (!node) return commandFailed('unknown_node_type', 'the landmarkPoint node type is not registered');
  context.store.setParam(node.id, 'x', x);
  context.store.setParam(node.id, 'y', y);
  context.store.setDisplay(node.id, binding);
  context.store.setLabel(node.id, name);
  return commandSucceeded(`inserted ${name} at (${x},${y}) as ${node.id}`);
}

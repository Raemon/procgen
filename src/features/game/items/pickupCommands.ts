import { stowSpawnedItem } from '@/features/asset-library/items/pickups/stowItems';
import {
  commandFailed,
  commandSucceeded,
  type CommandContext,
  type CommandMode,
  type CommandResult,
} from '@/features/app-shell/runtime/commands/command';
import { createCommandCollection } from '@/features/app-shell/runtime/commands/commandCollection';

const { define: registerCommand, commands: pickupCommands } = createCommandCollection();
export { pickupCommands };



const PICK_UP_DESCRIPTION =
  'Pick up the item lying on the tile you stand on and put it in the player character\'s bag. Walking onto a tile already stows whatever lies there, so this only matters for an item the bag had no room for earlier. Carrying an item that emits light lights the way wherever you walk.';

const PICK_UP_ACTIONS: readonly { action: string; mode: CommandMode; humanControl: string }[] = [
  { action: 'pick_up_item', mode: 'god', humanControl: 'automatic on walking over it, or G' },
  { action: 'pick_up', mode: 'character', humanControl: 'automatic on walking over it, or G' },
];

for (const spec of PICK_UP_ACTIONS) {
  registerCommand({
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

function pickUpItemUnderActor(context: CommandContext): CommandResult {
  const pose = context.actor.pose();
  const spawn = context.groundItems.at(pose.x, pose.y)[0];
  if (!spawn) {
    return commandFailed('nothing_to_pick_up', `no item lies at (${pose.x},${pose.y})`);
  }
  const outcome = stowSpawnedItem(context, spawn);
  return outcome.ok
    ? commandSucceeded(`picked up ${outcome.itemName} into slot ${outcome.slotX},${outcome.slotY}`)
    : commandFailed(outcome.code, outcome.hint);
}

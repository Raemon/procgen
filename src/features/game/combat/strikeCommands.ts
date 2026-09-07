import {
  commandFailed,
  commandSucceeded,
  type CommandContext,
  type CommandResult,
} from '@/features/app-shell/runtime/commands/command';
import { createCommandCollection } from '@/features/app-shell/runtime/commands/commandCollection';
import { STRIKE_REACH_TILES } from './strikes';

const { define: registerCommand, commands: strikeCommands } = createCommandCollection();
export { strikeCommands };

registerCommand({
  action: 'strike',
  modes: ['god', 'character', 'topdown'],
  group: 'movement',
  humanControl: 'C',
  description: `Swing at the nearest creature within ${STRIKE_REACH_TILES} tiles ahead of you, or at any creature close enough to touch whichever way you face. The blow does as much harm as the character you play has strength, and a creature that has taken more harm than it has vigor goes down for good. Anything that chases you strikes back the moment it catches you, so a fight is a trade; walking out of its sight ends it.`,
  params: {},
  example: { action: 'strike' },
  changesWorld: false,
  apply: (context) => strikeWhateverIsInReach(context),
});

function strikeWhateverIsInReach(context: CommandContext): CommandResult {
  const pose = context.actor.pose();
  const struck = context.livingCreatures.strikeFrom(pose);
  if (!struck) {
    return commandFailed(
      'nothing_within_reach',
      `nothing living stands within ${STRIKE_REACH_TILES} tiles ahead of (${pose.x},${pose.y})`,
    );
  }
  const blow = struck.outcome === 'slain' ? 'struck down' : 'struck';
  return commandSucceeded(`${blow} the ${struck.name} at (${struck.at.x},${struck.at.y})`);
}

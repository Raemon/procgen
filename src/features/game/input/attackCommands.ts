import {
  commandFailed,
  commandSucceeded,
  type CommandContext,
  type CommandMode,
  type CommandResult,
} from '@/features/app-shell/runtime/commands/command';
import { createCommandCollection } from '@/features/app-shell/runtime/commands/commandCollection';

const { define: registerCommand, commands: attackCommands } = createCommandCollection();
export { attackCommands };

const ATTACK_DESCRIPTION =
  'Strike the nearest creature within your reach, favoring the one you face. A creature that runs out of hp dies, drops whatever it carried, and its spawn stays dead in this world.';

const ATTACK_ACTIONS: readonly { action: string; mode: CommandMode }[] = [
  { action: 'attack', mode: 'character' },
  { action: 'attack_creature', mode: 'god' },
];

for (const spec of ATTACK_ACTIONS) {
  registerCommand({
    action: spec.action,
    mode: spec.mode,
    group: 'movement',
    humanControl: 'X',
    description: ATTACK_DESCRIPTION,
    params: {},
    example: { action: spec.action },
    changesWorld: false,
    apply: (context) => strikeAhead(context),
  });
}

function strikeAhead(context: CommandContext): CommandResult {
  const report = context.combat.strike(context.actor.pose());
  if (report.kind === 'sent') return commandSucceeded('swinging at what stands before you');
  if (report.kind === 'missed') {
    return commandFailed('nothing_in_reach', 'no creature stands within your reach');
  }
  const { creatureName, damage, remainingHp, slain } = report.outcome;
  return commandSucceeded(
    slain
      ? `slew the ${creatureName}`
      : `hit the ${creatureName} for ${damage} — ${remainingHp} hp left`,
  );
}

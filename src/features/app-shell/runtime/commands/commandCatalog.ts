import { assetLibraryCommands } from '@/features/asset-library/commands';
import { gameCommands } from '@/features/game/commands';
import type { CommandMode, CommandSpec } from './command';

const commands = [...assetLibraryCommands, ...gameCommands];
const commandsByAction = indexCommands(commands);

export function allCommands(): readonly CommandSpec[] {
  return commands;
}

export function commandFor(mode: CommandMode, action: string): CommandSpec | undefined {
  const command = commandsByAction.get(action);
  return command?.mode === mode ? command : undefined;
}

export function commandsForMode(mode: CommandMode): readonly CommandSpec[] {
  return commands.filter((command) => command.mode === mode);
}

function indexCommands(specs: readonly CommandSpec[]): Map<string, CommandSpec> {
  const byAction = new Map<string, CommandSpec>();
  for (const spec of specs) {
    if (byAction.has(spec.action)) throw new Error(`command '${spec.action}' has more than one owner`);
    byAction.set(spec.action, spec);
  }
  return byAction;
}

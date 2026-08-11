import {
  commandFailed,
  type CommandContext,
  type CommandMode,
  type CommandResult,
} from './command';
import { commandsForMode, commandFor } from './commandCatalog';
import { listOf } from './commandParams';

export function performCommand(
  context: CommandContext,
  mode: CommandMode,
  action: string,
  params: Record<string, unknown> = {},
): CommandResult {
  const spec = commandFor(mode, action);
  if (!spec) return unknownAction(mode, action);
  const missing = missingRequiredParams(spec.params, params);
  if (missing) return commandFailed('bad_request', missing);
  return spec.apply(context, params);
}

function unknownAction(mode: CommandMode, action: string): CommandResult {
  return commandFailed(
    'unknown_action',
    `'${action}' is not a ${mode}-mode action. Available: ${listOf(
      commandsForMode(mode).map((spec) => spec.action),
    )}`,
  );
}

function missingRequiredParams(
  declared: Record<string, { optional?: boolean }>,
  params: Record<string, unknown>,
): string | null {
  const missing = Object.entries(declared)
    .filter(([name, spec]) => !spec.optional && params[name] === undefined)
    .map(([name]) => name);
  return missing.length > 0 ? `missing required param(s): ${listOf(missing)}` : null;
}

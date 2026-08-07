import {
  abilityFailed,
  type AbilityContext,
  type AbilityMode,
  type AbilityResult,
} from './ability';
import { abilitiesForMode, abilityFor } from './abilityRegistry';
import { listOf } from './abilityParams';

export function performAbility(
  context: AbilityContext,
  mode: AbilityMode,
  action: string,
  params: Record<string, unknown> = {},
): AbilityResult {
  const spec = abilityFor(mode, action);
  if (!spec) return unknownAction(mode, action);
  const missing = missingRequiredParams(spec.params, params);
  if (missing) return abilityFailed('bad_request', missing);
  return spec.apply(context, params);
}

export function abilityChangesWorld(mode: AbilityMode, action: string): boolean {
  return abilityFor(mode, action)?.changesWorld ?? false;
}

function unknownAction(mode: AbilityMode, action: string): AbilityResult {
  return abilityFailed(
    'unknown_action',
    `'${action}' is not a ${mode}-mode action. Available: ${listOf(
      abilitiesForMode(mode).map((spec) => spec.action),
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

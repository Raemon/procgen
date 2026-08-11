import type { AbilityMode, AbilitySpec } from './ability';

const registry = new Map<string, AbilitySpec>();

export function registerAbility(spec: AbilitySpec): AbilitySpec {
  rejectDuplicate(spec);
  rejectUndocumentedParams(spec);
  rejectExampleMismatch(spec);
  registry.set(spec.action, spec);
  return spec;
}

export function abilityFor(mode: AbilityMode, action: string): AbilitySpec | undefined {
  const spec = registry.get(action);
  return spec?.mode === mode ? spec : undefined;
}

export function allAbilities(): AbilitySpec[] {
  return [...registry.values()];
}

export function abilitiesForMode(mode: AbilityMode): AbilitySpec[] {
  return allAbilities().filter((spec) => spec.mode === mode);
}

function rejectDuplicate(spec: AbilitySpec): void {
  if (registry.has(spec.action)) {
    throw new Error(`ability '${spec.action}' is already registered — action names are the API surface`);
  }
}

function rejectUndocumentedParams(spec: AbilitySpec): void {
  for (const [name, param] of Object.entries(spec.params)) {
    if (param.help.trim() === '') {
      throw new Error(`ability '${spec.action}' param '${name}' needs help text — it is rendered into GET /api/v1/docs`);
    }
  }
}

function rejectExampleMismatch(spec: AbilitySpec): void {
  if (spec.example.action !== spec.action) {
    throw new Error(`ability '${spec.action}' example must carry "action": "${spec.action}"`);
  }
  for (const name of Object.keys(spec.example)) {
    if (name !== 'action' && !spec.params[name]) {
      throw new Error(`ability '${spec.action}' example sets undeclared param '${name}'`);
    }
  }
  for (const [name, param] of Object.entries(spec.params)) {
    if (!param.optional && spec.example[name] === undefined) {
      throw new Error(`ability '${spec.action}' example is missing required param '${name}'`);
    }
  }
}

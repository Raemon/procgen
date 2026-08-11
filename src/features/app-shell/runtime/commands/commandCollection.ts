import type { CommandSpec } from './command';

export function createCommandCollection(): {
  commands: CommandSpec[];
  define: (spec: CommandSpec) => CommandSpec;
} {
  const commands: CommandSpec[] = [];
  return {
    commands,
    define: (spec) => defineCommand(commands, spec),
  };
}

function defineCommand(commands: CommandSpec[], spec: CommandSpec): CommandSpec {
  rejectDuplicate(commands, spec);
  rejectUndocumentedParams(spec);
  rejectExampleMismatch(spec);
  commands.push(spec);
  return spec;
}

function rejectDuplicate(commands: CommandSpec[], spec: CommandSpec): void {
  if (commands.some((existing) => existing.action === spec.action)) {
    throw new Error(`command '${spec.action}' is already defined by this feature`);
  }
}

function rejectUndocumentedParams(spec: CommandSpec): void {
  for (const [name, param] of Object.entries(spec.params)) {
    if (param.help.trim() === '') throw new Error(`command '${spec.action}' param '${name}' needs help text`);
  }
}

function rejectExampleMismatch(spec: CommandSpec): void {
  if (spec.example.action !== spec.action) {
    throw new Error(`command '${spec.action}' example must carry "action": "${spec.action}"`);
  }
  for (const name of Object.keys(spec.example)) {
    if (name !== 'action' && !spec.params[name]) {
      throw new Error(`command '${spec.action}' example sets undeclared param '${name}'`);
    }
  }
  for (const [name, param] of Object.entries(spec.params)) {
    if (!param.optional && spec.example[name] === undefined) {
      throw new Error(`command '${spec.action}' example is missing required param '${name}'`);
    }
  }
}

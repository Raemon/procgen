import { commandsForMode } from '@/features/app-shell/runtime/commands/commandCatalog';
import type {
  CommandMode,
  CommandParamSpec,
  CommandSpec,
} from '@/features/app-shell/runtime/commands/command';

export interface AgentToolContract {
  name: string;
  description: string;
  input_schema: object;
  transport: 'http' | 'websocket';
  method: 'GET' | 'PUT' | 'POST';
  path: string;
}

export function agentToolContracts(mode: CommandMode): AgentToolContract[] {
  return commandsForMode(mode).map(toolContract);
}

const LAB_PATHS: Readonly<Record<string, string>> = {
  grade_world: '/asset-library/worlds/grade',
  roll_worlds: '/asset-library/worlds/roll',
  train_worlds: '/asset-library/worlds/train',
  read_world_lab: '/asset-library/worlds/lab',
  stop_lab_run: '/asset-library/worlds/lab/{id}/stop',
  install_lab_worlds: '/asset-library/worlds/lab/{id}/install',
};

function toolContract(spec: CommandSpec): AgentToolContract {
  const entries = Object.entries(spec.params);
  const gameInput = spec.mode === 'character' || spec.group === 'movement' || spec.group === 'senses';
  const labPath = LAB_PATHS[spec.action];
  if (labPath) {
    return {
      name: spec.action,
      description: `${spec.description} (the human does this with: ${spec.humanControl})`,
      input_schema: inputSchema(entries),
      transport: 'http',
      method: spec.action === 'read_world_lab' ? 'GET' : 'POST',
      path: labPath,
    };
  }
  return {
    name: spec.action,
    description: `${spec.description} (the human does this with: ${spec.humanControl})`,
    input_schema: inputSchema(entries),
    transport: gameInput ? 'websocket' : 'http',
    method: gameInput ? 'POST' : 'PUT',
    path: gameInput ? '/game/socket' : resourcePath(spec.action),
  };
}

function inputSchema(entries: [string, CommandParamSpec][]): object {
  return {
    type: 'object',
    properties: Object.fromEntries(entries.map(([name, param]) => [name, paramSchema(param)])),
    required: entries.filter(([, param]) => !param.optional).map(([name]) => name),
    additionalProperties: false,
  };
}

function resourcePath(action: string): string {
  if (action.includes('asset_folder') || action === 'file_asset') return '/asset-library/folders';
  if (action.includes('tile')) return '/asset-library/tiles';
  if (action.includes('item') || action.includes('inventory')) return '/asset-library/items';
  if (action.includes('piece') || action === 'capture_region') return '/asset-library/pieces';
  if (action.includes('culture')) return '/asset-library/cultures';
  if (action.includes('creature') || action.includes('character')) return '/asset-library/creatures';
  if (action.includes('template')) return '/asset-library/node-groups';
  return '/asset-library/worlds/current';
}

function paramSchema(param: CommandParamSpec): object {
  return { ...typeSchema(param.kind), description: param.help };
}

function typeSchema(kind: CommandParamSpec['kind']): object {
  if (kind === 'int') return { type: 'integer' };
  if (kind === 'number') return { type: 'number' };
  if (kind === 'json') return {};
  return { type: 'string' };
}

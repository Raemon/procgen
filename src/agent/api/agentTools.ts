import '../../abilities/index';
import { abilitiesForMode } from '../../abilities/abilityRegistry';
import type { AbilityParamSpec, AbilitySpec } from '../../abilities/ability';
import type { AgentMode } from '../agentMode';

export const META_TOOLS = {
  finish: 'finish',
  remember: 'remember',
  forget: 'forget',
  writeScript: 'write_script',
  runScript: 'run_script',
  deleteScript: 'delete_script',
  inspectPipeline: 'inspect_pipeline',
  inspectNodeTypes: 'inspect_node_types',
} as const;

const META_TOOL_NAMES: ReadonlySet<string> = new Set(Object.values(META_TOOLS));
const GOD_ONLY_META_TOOLS: ReadonlySet<string> = new Set([
  META_TOOLS.inspectPipeline,
  META_TOOLS.inspectNodeTypes,
]);

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: object;
}

export function isMetaTool(mode: AgentMode, name: string): boolean {
  if (!META_TOOL_NAMES.has(name)) return false;
  return mode === 'god' || !GOD_ONLY_META_TOOLS.has(name);
}

export function toolDefinitions(mode: AgentMode): ToolDefinition[] {
  return [...abilityTools(mode), ...metaTools(mode)];
}

function abilityTools(mode: AgentMode): ToolDefinition[] {
  return abilitiesForMode(mode).map(abilityTool);
}

function abilityTool(spec: AbilitySpec): ToolDefinition {
  const entries = Object.entries(spec.params);
  return {
    name: spec.action,
    description: `${spec.description} (the human does this with: ${spec.humanControl})`,
    input_schema: {
      type: 'object',
      properties: Object.fromEntries(entries.map(([name, param]) => [name, paramSchema(param)])),
      required: entries.filter(([, param]) => !param.optional).map(([name]) => name),
      additionalProperties: false,
    },
  };
}

function paramSchema(param: AbilityParamSpec): object {
  return { ...typeSchema(param.kind), description: param.help };
}

function typeSchema(kind: AbilityParamSpec['kind']): object {
  if (kind === 'int') return { type: 'integer' };
  if (kind === 'number') return { type: 'number' };
  if (kind === 'json') return {};
  return { type: 'string' };
}

function metaTools(mode: AgentMode): ToolDefinition[] {
  const tools: ToolDefinition[] = [
    {
      name: META_TOOLS.finish,
      description: 'End the run with a short summary of what happened.',
      input_schema: {
        type: 'object',
        properties: { summary: { type: 'string' } },
        required: ['summary'],
        additionalProperties: false,
      },
    },
    {
      name: META_TOOLS.remember,
      description:
        'Save a note to memory. Memory survives history trimming and later runs, and every observation repeats it back to you. Record what you learned and would want to know at the start of a fresh run — not a log of what you just did.',
      input_schema: {
        type: 'object',
        properties: {
          note: { type: 'string', description: 'one lesson or fact, stated so it stands alone' },
        },
        required: ['note'],
        additionalProperties: false,
      },
    },
    {
      name: META_TOOLS.forget,
      description: 'Delete a memory note that turned out to be wrong or is no longer worth carrying.',
      input_schema: {
        type: 'object',
        properties: { id: { type: 'string', description: 'the note id shown in memory, e.g. m3' } },
        required: ['id'],
        additionalProperties: false,
      },
    },
    {
      name: META_TOOLS.writeScript,
      description:
        'Save a named script: one action per line, params as key=value, optionally prefixed with "repeat N". Writing a name that already exists replaces it. Scripts persist like memory, and every observation lists the ones you have.',
      input_schema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'short name you will call it by' },
          description: { type: 'string', description: 'what it does and when to use it' },
          body: {
            type: 'string',
            description:
              'newline-separated lines, e.g. "repeat 4 step_forward" or "place_tile tile_id=3". # starts a comment.',
          },
        },
        required: ['name', 'description', 'body'],
        additionalProperties: false,
      },
    },
    {
      name: META_TOOLS.runScript,
      description:
        'Run a saved script. It stops at the first line that fails and tells you which line and why.',
      input_schema: {
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name'],
        additionalProperties: false,
      },
    },
    {
      name: META_TOOLS.deleteScript,
      description: 'Delete a saved script.',
      input_schema: {
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name'],
        additionalProperties: false,
      },
    },
  ];
  if (mode === 'god') {
    tools.push(
      {
        name: META_TOOLS.inspectPipeline,
        description: 'Read the current node pipeline: every node with its id, type, params, wiring and display.',
        input_schema: { type: 'object', properties: {}, additionalProperties: false },
      },
      {
        name: META_TOOLS.inspectNodeTypes,
        description: 'Read the catalog of node types you can add, with every param and input explained.',
        input_schema: { type: 'object', properties: {}, additionalProperties: false },
      },
    );
  }
  return tools;
}

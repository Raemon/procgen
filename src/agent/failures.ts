export interface FailureSpec {
  code: string;
  meaning: string;
  recovery: string;
}

export const FAILURES: readonly FailureSpec[] = [
  {
    code: 'blocked',
    meaning: 'You tried to step onto a tile that would not take you.',
    recovery: 'Observe and go a different way.',
  },
  {
    code: 'locked_door',
    meaning: 'You stepped into a door cell that is locked for you. Doors stay locked until you hold their matching key.',
    recovery: 'The failure hint names the key tag. Find that key marker in the world, step onto it to take the key, then walk through the door.',
  },
  {
    code: 'unknown_action',
    meaning: "The action name is not one of this mode's verbs.",
    recovery: 'GET /api/v1/docs lists every action for each mode.',
  },
  {
    code: 'unknown_agent',
    meaning: 'No agent with that id exists. The server may have restarted since it was created.',
    recovery: 'POST /api/v1/agents to create a new one.',
  },
  {
    code: 'agent_busy',
    meaning: 'An autopilot run is already driving this agent.',
    recovery: 'POST /api/v1/agents/{id}/stop first, or wait for the run to finish.',
  },
  {
    code: 'unknown_node',
    meaning: 'No node with that id exists in the pipeline.',
    recovery: 'GET /api/v1/pipeline lists every node with its id.',
  },
  {
    code: 'unknown_node_type',
    meaning: 'No node type with that id is registered.',
    recovery: 'GET /api/v1/node-types lists every type you can add.',
  },
  {
    code: 'unknown_param',
    meaning: "The node's type has no param or input with that name.",
    recovery: 'The failure hint lists the names this node actually has.',
  },
  {
    code: 'invalid_value',
    meaning: 'The value does not fit the param: wrong kind, or not one of its choices.',
    recovery: 'GET /api/v1/node-types shows each param\'s kind, range and choices.',
  },
  {
    code: 'invalid_wire',
    meaning: 'That connection is not allowed: sources must be EARLIER nodes with a matching output kind.',
    recovery: 'Move the source above the consumer with move_node, or pick a matching source.',
  },
  {
    code: 'invalid_display',
    meaning: "That display mode does not fit the node's output kind.",
    recovery: 'tiles → tileLayer, field → elevation, points → markers; hidden always fits.',
  },
  {
    code: 'bad_request',
    meaning: 'The request body was not valid JSON or is missing a required field.',
    recovery: 'Check the endpoint table in GET /api/v1/docs.',
  },
];

export function failureByCode(code: string): FailureSpec | undefined {
  return FAILURES.find((failure) => failure.code === code);
}

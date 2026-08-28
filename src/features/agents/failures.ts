export interface FailureSpec {
  code: string;
  meaning: string;
  recovery: string;
}

export const FAILURES: readonly FailureSpec[] = [
  {
    code: 'nothing_in_reach',
    meaning: 'No creature stands within attack reach.',
    recovery: 'Step toward the creature and face it, then attack again.',
  },
  {
    code: 'blocked',
    meaning: 'You tried to step onto a tile that would not take you.',
    recovery:
      'The hint names what refused you. The elevation digits in your observation are climb levels: a step up at most 1 level succeeds, higher ground needs another route, and stepping down any drop is free.',
  },
  {
    code: 'unknown_action',
    meaning: "The action name is not one of this mode's verbs.",
    recovery: 'GET /api/v1/openapi.json lists every action for each mode.',
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
    recovery: 'GET /api/v1/asset-library/world-seeds/current lists every node with its id.',
  },
  {
    code: 'unknown_node_type',
    meaning: 'No node type with that id is registered.',
    recovery: 'GET /api/v1/asset-library/node-types lists every type you can add.',
  },
  {
    code: 'unknown_param',
    meaning: "The node's type has no param or input with that name.",
    recovery: 'The failure hint lists the names this node actually has.',
  },
  {
    code: 'invalid_value',
    meaning: 'The value does not fit the param: wrong kind, or not one of its choices.',
    recovery: 'GET /api/v1/asset-library/node-types shows each param\'s kind, range and choices.',
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
    code: 'no_inventory',
    meaning: 'That creature has no inventory grid yet.',
    recovery: 'set_inventory gives it one; GET /api/v1/asset-library/creatures reports who has one.',
  },
  {
    code: 'no_billboard',
    meaning: 'That character has no billboard sprites yet.',
    recovery: 'set_character_frame paints the first one and creates the billboard.',
  },
  {
    code: 'placement_refused',
    meaning:
      'The item does not fit there: it would hang off the grid, cover an unusable slot, cover a slot whose tags it does not carry, or overlap an item already placed.',
    recovery:
      'GET /api/v1/asset-library/creatures shows the grid, its slot tags and what is already placed.',
  },
  {
    code: 'nothing_to_pick_up',
    meaning: 'No item lies on the tile you are standing on.',
    recovery: 'Observe first: items show as their own symbol in the legend, then step onto one.',
  },
  {
    code: 'name_taken',
    meaning: 'Something in the library already answers to that name.',
    recovery:
      'Worlds and node groups are named uniquely: GET /api/v1/asset-library/world-seeds and /api/v1/asset-library/node-groups list the names in use.',
  },
  {
    code: 'bad_request',
    meaning: 'The request body was not valid JSON or is missing a required field.',
    recovery: 'Check the endpoint table in GET /api/v1/openapi.json.',
  },
];

export function failureByCode(code: string): FailureSpec | undefined {
  return FAILURES.find((failure) => failure.code === code);
}

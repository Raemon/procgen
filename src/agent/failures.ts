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
    code: 'bad_request',
    meaning: 'The request body was not valid JSON or is missing a required field.',
    recovery: 'Check the endpoint table in GET /api/v1/docs.',
  },
];

export function failureByCode(code: string): FailureSpec | undefined {
  return FAILURES.find((failure) => failure.code === code);
}

import { agentDriver, AGENT_DRIVER_NAME } from './agentDriver';
import type { SeededAgentPolicy } from './agentPolicy';
import { explorerWalkDriver, EXPLORER_WALK_DRIVER_NAME } from './explorerWalkDriver';
import { llmAutopilotPolicy, LLM_POLICY_NAME } from './llmAutopilotPolicy';
import { scriptedExplorerPolicy, SCRIPTED_POLICY_NAME } from './scriptedExplorerPolicy';
import type { WorldDriver } from './worldDriver';

const DEFAULT_LLM_MODEL = 'claude-sonnet-5';
const DEFAULT_GOAL = 'explore as much of this world as you can';

type Environment = Record<string, string | undefined>;

export function driverFromEnvironment(env: Environment): WorldDriver {
  const asked = env.WORLD_DRIVER ?? EXPLORER_WALK_DRIVER_NAME;
  if (asked === EXPLORER_WALK_DRIVER_NAME) return explorerWalkDriver;
  if (asked === AGENT_DRIVER_NAME) return agentDriver(policyFrom(env));
  throw new Error(
    `WORLD_DRIVER='${asked}' is not a driver: use '${EXPLORER_WALK_DRIVER_NAME}' or '${AGENT_DRIVER_NAME}'`,
  );
}

function policyFrom(env: Environment): SeededAgentPolicy {
  const asked = env.AGENT_POLICY ?? SCRIPTED_POLICY_NAME;
  if (asked === SCRIPTED_POLICY_NAME) return scriptedExplorerPolicy;
  if (asked === LLM_POLICY_NAME) return aFreshLlmPolicyPerWorld(env);
  throw new Error(
    `AGENT_POLICY='${asked}' is not a policy: use '${SCRIPTED_POLICY_NAME}' or '${LLM_POLICY_NAME}'`,
  );
}

function aFreshLlmPolicyPerWorld(env: Environment): SeededAgentPolicy {
  const opts = {
    apiKey: theAnthropicKeyTheLlmPolicyNeeds(env.ANTHROPIC_API_KEY),
    model: env.AGENT_MODEL ?? DEFAULT_LLM_MODEL,
    goal: env.AGENT_GOAL ?? DEFAULT_GOAL,
  };
  return { name: LLM_POLICY_NAME, forSeed: () => llmAutopilotPolicy(opts) };
}

function theAnthropicKeyTheLlmPolicyNeeds(apiKey: string | undefined): string {
  if (apiKey) return apiKey;
  throw new Error(
    'the llm policy needs an Anthropic API key: set ANTHROPIC_API_KEY before asking for it',
  );
}

import type { AgentPolicy } from './agentPolicy';
import { llmAutopilotPolicy, LLM_POLICY_NAME } from './llmAutopilotPolicy';
import { scriptedExplorerPolicy, SCRIPTED_POLICY_NAME } from './scriptedExplorerPolicy';

const DEFAULT_LLM_MODEL = 'claude-sonnet-5';
const DEFAULT_GOAL = 'explore as much of this world as you can';

export function policyFromEnvironment(
  env: Record<string, string | undefined>,
  seed: number,
): AgentPolicy {
  const asked = env.AGENT_POLICY ?? SCRIPTED_POLICY_NAME;
  if (asked === SCRIPTED_POLICY_NAME) return scriptedExplorerPolicy(seed);
  if (asked === LLM_POLICY_NAME) {
    return llmAutopilotPolicy({
      apiKey: env.ANTHROPIC_API_KEY ?? null,
      model: env.AGENT_MODEL ?? DEFAULT_LLM_MODEL,
      goal: env.AGENT_GOAL ?? DEFAULT_GOAL,
    });
  }
  throw new Error(
    `AGENT_POLICY='${asked}' is not a policy: use '${SCRIPTED_POLICY_NAME}' or '${LLM_POLICY_NAME}'`,
  );
}

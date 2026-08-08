import {
  callAnthropic,
  type AnthropicMessage,
  type ContentBlock,
} from '../../../api/agent/anthropicClient';
import { toolDefinitions, META_TOOLS } from '../../../api/agent/agentTools';
import type { AgentAction, AgentPolicy, AgentTurnView } from './agentPolicy';

export const LLM_POLICY_NAME = 'llm';

const MAX_RESPONSE_TOKENS = 2048;
const HISTORY_MESSAGE_CAP = 20;

export interface LlmPolicyOpts {
  apiKey: string | null;
  model: string;
  goal: string;
}

export function llmAutopilotPolicy(opts: LlmPolicyOpts): AgentPolicy {
  const apiKey = requiredApiKey(opts.apiKey);
  const tools = toolDefinitions('character');
  const messages: AnthropicMessage[] = [];
  let pendingToolUseId: string | null = null;
  const decide = async (view: AgentTurnView): Promise<AgentAction | null> => {
    messages.push(replyTo(pendingToolUseId, view));
    trimHistory(messages);
    const reply = await callAnthropic({
      apiKey,
      model: opts.model,
      maxTokens: MAX_RESPONSE_TOKENS,
      system: systemPrompt(opts.goal),
      tools,
      messages,
      onRetry: () => {},
    });
    messages.push({ role: 'assistant', content: reply.content });
    const toolUse = reply.content.find((block) => block.type === 'tool_use');
    if (!toolUse || toolUse.name === META_TOOLS.finish) return null;
    pendingToolUseId = toolUse.id ?? null;
    return { action: toolUse.name ?? '', params: (toolUse.input ?? {}) as Record<string, unknown> };
  };
  return { name: LLM_POLICY_NAME, decide };
}

function requiredApiKey(apiKey: string | null): string {
  if (apiKey) return apiKey;
  throw new Error(
    'the llm policy needs an Anthropic API key: set ANTHROPIC_API_KEY before asking for it',
  );
}

function replyTo(pendingToolUseId: string | null, view: AgentTurnView): AnthropicMessage {
  const text = observationTurnText(view);
  if (!pendingToolUseId) return { role: 'user', content: [{ type: 'text', text }] };
  return {
    role: 'user',
    content: [
      {
        type: 'tool_result',
        tool_use_id: pendingToolUseId,
        is_error: view.lastFailure !== null,
        content: text,
      } as unknown as ContentBlock,
    ],
  };
}

function observationTurnText(view: AgentTurnView): string {
  return [
    view.lastOutcome ? `outcome: ${view.lastOutcome}` : '',
    view.lastFailure ? `failure: ${view.lastFailure}` : '',
    view.observationText,
  ]
    .filter((line) => line !== '')
    .join('\n');
}

function systemPrompt(goal: string): string {
  return [
    'You are driving a character-mode agent in a procedurally generated world; each tool is one action there.',
    'Act one step at a time, using the observation in front of you rather than anything you remember.',
    `Your goal: ${goal}`,
    'Call finish when the goal is done or clearly impossible.',
  ].join('\n');
}

function trimHistory(messages: AnthropicMessage[]): void {
  if (messages.length <= HISTORY_MESSAGE_CAP) return;
  messages.splice(0, messages.length - HISTORY_MESSAGE_CAP);
  messages[0] = { role: 'user', content: [{ type: 'text', text: orphanedTurnText(messages[0]) }] };
}

function orphanedTurnText(message: AnthropicMessage | undefined): string {
  const blocks = Array.isArray(message?.content) ? (message.content as Record<string, unknown>[]) : [];
  return blocks.map((block) => String(block.text ?? block.content ?? '')).join('\n');
}

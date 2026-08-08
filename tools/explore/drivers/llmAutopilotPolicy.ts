import { callAnthropic, type AnthropicMessage, type AnthropicReply } from '../../../api/agent/anthropicClient';
import {
  toolResultBlock,
  trimHistoryKeepingToolPairs,
} from '../../../api/agent/anthropicConversation';
import { toolDefinitions, META_TOOLS } from '../../../api/agent/agentTools';
import type { AgentAction, AgentPolicy, AgentTurnView } from './agentPolicy';

export const LLM_POLICY_NAME = 'llm';

const MAX_RESPONSE_TOKENS = 2048;
const HISTORY_MESSAGE_CAP = 20;

export interface LlmPolicyOpts {
  apiKey: string;
  model: string;
  goal: string;
}

interface Conversation {
  messages: AnthropicMessage[];
  pendingToolUseId: string | null;
}

export function llmAutopilotPolicy(opts: LlmPolicyOpts): AgentPolicy {
  const conversation: Conversation = { messages: [], pendingToolUseId: null };
  return {
    name: LLM_POLICY_NAME,
    decide: (view) => actionAskedOfTheModel(opts, conversation, view),
  };
}

async function actionAskedOfTheModel(
  opts: LlmPolicyOpts,
  conversation: Conversation,
  view: AgentTurnView,
): Promise<AgentAction | null> {
  conversation.messages.push(replyTo(conversation.pendingToolUseId, view));
  trimHistoryKeepingToolPairs(conversation.messages, HISTORY_MESSAGE_CAP);
  const reply = await askForOneAction(opts, conversation.messages);
  conversation.messages.push({ role: 'assistant', content: reply.content });
  const toolUse = reply.content.find((block) => block.type === 'tool_use');
  if (!toolUse || toolUse.name === META_TOOLS.finish) return null;
  conversation.pendingToolUseId = toolUse.id ?? null;
  return { action: toolUse.name ?? '', params: (toolUse.input ?? {}) as Record<string, unknown> };
}

function askForOneAction(
  opts: LlmPolicyOpts,
  messages: readonly AnthropicMessage[],
): Promise<AnthropicReply> {
  return callAnthropic({
    apiKey: opts.apiKey,
    model: opts.model,
    maxTokens: MAX_RESPONSE_TOKENS,
    system: systemPrompt(opts.goal),
    tools: toolDefinitions('character'),
    messages,
    onRetry: () => {},
  });
}

function replyTo(pendingToolUseId: string | null, view: AgentTurnView): AnthropicMessage {
  const text = observationTurnText(view);
  if (!pendingToolUseId) return { role: 'user', content: [{ type: 'text', text }] };
  return {
    role: 'user',
    content: [toolResultBlock(pendingToolUseId, text, view.lastFailure !== null)],
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

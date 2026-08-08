import type { AnthropicMessage } from './anthropicClient';

export function trimHistoryKeepingToolPairs(messages: AnthropicMessage[], cap: number): void {
  while (messages.length > cap) messages.splice(1, 2);
}

export function toolResultBlock(
  toolUseId: string | undefined,
  text: string,
  isError: boolean,
): object {
  return { type: 'tool_result', tool_use_id: toolUseId, is_error: isError, content: text };
}

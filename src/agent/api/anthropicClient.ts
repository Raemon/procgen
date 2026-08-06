import type { ToolDefinition } from './agentTools';
import type { TokenUsage } from '../pricing';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const MAX_ATTEMPTS = 5;
const FIRST_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 16000;
const MAX_RETRY_AFTER_MS = 180000;
const RETRYABLE_STATUSES: ReadonlySet<number> = new Set([408, 409, 429, 500, 502, 503, 504, 529]);

export interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: unknown;
}

export interface ContentBlock {
  type: string;
  id?: string;
  name?: string;
  input?: unknown;
  text?: string;
  thinking?: string;
}

export interface AnthropicReply {
  content: ContentBlock[];
  stop_reason: string;
  usage?: TokenUsage;
}

export interface AnthropicCall {
  apiKey: string;
  model: string;
  maxTokens: number;
  system: string;
  tools: readonly ToolDefinition[];
  messages: readonly AnthropicMessage[];
  onRetry(note: string): void;
}

export async function callAnthropic(call: AnthropicCall): Promise<AnthropicReply> {
  for (let attempt = 1; ; attempt += 1) {
    const outcome = await attemptCall(call);
    if (outcome.ok) return outcome.reply;
    if (attempt >= MAX_ATTEMPTS || !outcome.retryable) throw new Error(outcome.error);
    const waitMs = outcome.retryAfterMs ?? backoffMs(attempt);
    call.onRetry(`${outcome.error} — retrying in ${Math.round(waitMs / 100) / 10}s (attempt ${attempt + 1} of ${MAX_ATTEMPTS})`);
    await sleep(waitMs);
  }
}

type CallOutcome =
  | { ok: true; reply: AnthropicReply }
  | { ok: false; retryable: boolean; error: string; retryAfterMs?: number };

async function attemptCall(call: AnthropicCall): Promise<CallOutcome> {
  let response: Response;
  try {
    response = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': call.apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify(requestBody(call)),
    });
  } catch (error) {
    return { ok: false, retryable: true, error: `network error: ${String(error)}` };
  }
  if (response.ok) return { ok: true, reply: (await response.json()) as AnthropicReply };
  return {
    ok: false,
    retryable: RETRYABLE_STATUSES.has(response.status),
    error: `Anthropic API ${response.status}: ${await response.text()}`,
    retryAfterMs: retryAfterMs(response),
  };
}

function requestBody(call: AnthropicCall): object {
  return {
    model: call.model,
    max_tokens: call.maxTokens,
    system: [{ type: 'text', text: call.system, cache_control: { type: 'ephemeral' } }],
    tools: call.tools,
    messages: call.messages,
  };
}

function retryAfterMs(response: Response): number | undefined {
  const header = response.headers.get('retry-after');
  if (!header) return undefined;
  const seconds = Number(header);
  if (!Number.isFinite(seconds) || seconds < 0) return undefined;
  return Math.min(seconds * 1000, MAX_RETRY_AFTER_MS);
}

function backoffMs(attempt: number): number {
  const flat = Math.min(FIRST_BACKOFF_MS * 2 ** (attempt - 1), MAX_BACKOFF_MS);
  return flat / 2 + Math.random() * (flat / 2);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

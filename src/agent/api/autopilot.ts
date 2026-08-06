import { applyAction } from '../actions';
import { buildApiDocs } from '../apiDocs';
import { verbsForMode } from '../controls';
import { buildObservation } from '../observation';
import { observationText } from '../observationText';
import type { ServerWorld } from './serverWorld';
import { appendTranscript, sessionActor, sessionPose, type AgentSession } from './sessions';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const MAX_RESPONSE_TOKENS = 1500;
const HISTORY_MESSAGE_CAP = 40;

export interface AutopilotOpts {
  goal: string;
  model: string;
  maxSteps: number;
  apiKey: string | null;
}

export function startAutopilot(
  session: AgentSession,
  worldProvider: () => ServerWorld,
  opts: AutopilotOpts,
): void {
  session.run = {
    goal: opts.goal,
    model: opts.model,
    status: 'running',
    steps: 0,
    maxSteps: opts.maxSteps,
    transcript: [],
    stopRequested: false,
  };
  void driveAgent(session, worldProvider, opts).catch((error) => {
    if (!session.run) return;
    appendTranscript(session.run, 'error', String(error));
    session.run.status = 'error';
  });
}

async function driveAgent(
  session: AgentSession,
  worldProvider: () => ServerWorld,
  opts: AutopilotOpts,
): Promise<void> {
  const run = session.run!;
  if (!opts.apiKey) {
    appendTranscript(
      run,
      'error',
      'no Anthropic API key: pass anthropic_api_key in the run request or set ANTHROPIC_API_KEY on the server',
    );
    run.status = 'error';
    return;
  }
  appendTranscript(run, 'status', `run started: ${opts.goal} (${opts.model}, max ${opts.maxSteps} steps)`);
  const messages: AnthropicMessage[] = [
    { role: 'user', content: `Your goal: ${opts.goal}\n\nFirst observation:\n${observe(session, worldProvider)}` },
  ];
  while (run.status === 'running') {
    if (run.stopRequested) return endRun(run, 'stopped', 'stopped by request');
    if (run.steps >= run.maxSteps) return endRun(run, 'finished', 'step budget spent');
    const reply = await callAnthropic(opts, worldProvider().tileset, session, messages);
    messages.push({ role: 'assistant', content: reply.content });
    const toolUse = recordReply(run, reply);
    if (!toolUse) return endRun(run, 'finished', 'the model ended its turn');
    if (toolUse.name === 'finish') {
      return endRun(run, 'finished', `finished: ${String((toolUse.input as { summary?: unknown }).summary ?? '')}`);
    }
    messages.push({ role: 'user', content: [toolResultBlock(session, worldProvider, run, toolUse)] });
    trimHistory(messages);
  }
}

function endRun(run: NonNullable<AgentSession['run']>, status: 'stopped' | 'finished', note: string): void {
  appendTranscript(run, 'status', note);
  run.status = status;
}

function observe(session: AgentSession, worldProvider: () => ServerWorld): string {
  const world = worldProvider();
  return observationText(buildObservation(world.sampler, world.tileset, sessionPose(session), session.mode));
}

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: unknown;
}

interface ContentBlock {
  type: string;
  id?: string;
  name?: string;
  input?: unknown;
  text?: string;
  thinking?: string;
}

interface AnthropicReply {
  content: ContentBlock[];
  stop_reason: string;
}

async function callAnthropic(
  opts: AutopilotOpts,
  tileset: ServerWorld['tileset'],
  session: AgentSession,
  messages: AnthropicMessage[],
): Promise<AnthropicReply> {
  const response = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': opts.apiKey!,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: opts.model,
      max_tokens: MAX_RESPONSE_TOKENS,
      system: systemPrompt(tileset, session),
      tools: toolDefinitions(session),
      messages,
    }),
  });
  if (!response.ok) throw new Error(`Anthropic API ${response.status}: ${await response.text()}`);
  return (await response.json()) as AnthropicReply;
}

function systemPrompt(tileset: ServerWorld['tileset'], session: AgentSession): string {
  return [
    `You are driving a ${session.mode}-mode agent in a procedurally generated world through the act tool.`,
    'Act one step at a time; every tool result is a fresh observation. Call finish when the goal is done or clearly impossible.',
    '',
    buildApiDocs(tileset),
  ].join('\n');
}

function toolDefinitions(session: AgentSession) {
  return [
    {
      name: 'act',
      description: 'Perform one action in the world.',
      input_schema: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: verbsForMode(session.mode).map((verb) => verb.action) },
        },
        required: ['action'],
      },
    },
    {
      name: 'finish',
      description: 'End the run with a short summary of what happened.',
      input_schema: {
        type: 'object',
        properties: { summary: { type: 'string' } },
        required: ['summary'],
      },
    },
  ];
}

function recordReply(run: NonNullable<AgentSession['run']>, reply: AnthropicReply): ContentBlock | null {
  let toolUse: ContentBlock | null = null;
  for (const block of reply.content) {
    if (block.type === 'thinking' && block.thinking) appendTranscript(run, 'thinking', block.thinking);
    if (block.type === 'text' && block.text) appendTranscript(run, 'message', block.text);
    if (block.type === 'tool_use') {
      appendTranscript(run, 'tool_use', `${block.name} ${JSON.stringify(block.input)}`);
      toolUse = block;
    }
  }
  return toolUse;
}

function toolResultBlock(
  session: AgentSession,
  worldProvider: () => ServerWorld,
  run: NonNullable<AgentSession['run']>,
  toolUse: ContentBlock,
) {
  const world = worldProvider();
  const action = String((toolUse.input as { action?: unknown }).action ?? '');
  const outcome = applyAction(sessionActor(session, world.isWalkable), session.mode, action);
  session.lastAction = { action, outcome };
  run.steps += 1;
  appendTranscript(run, 'tool_result', `${outcome} at (${session.x},${session.y})`);
  return {
    type: 'tool_result',
    tool_use_id: toolUse.id,
    content: `outcome: ${outcome}\n\n${observe(session, worldProvider)}`,
  };
}

function trimHistory(messages: AnthropicMessage[]): void {
  while (messages.length > HISTORY_MESSAGE_CAP) messages.splice(1, 2);
}

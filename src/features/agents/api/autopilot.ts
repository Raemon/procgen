import { buildApiDocs } from './docs/apiDocs';
import { nodeTypesJson, pipelineJson } from '../nodeCatalog';
import { buildObservation } from '../observation';
import { observationText } from '../observationText';
import { formatUsd, modelIsPriced, usageCostUsd } from '../pricing';
import {
  callAnthropic,
  type AnthropicMessage,
  type AnthropicReply,
  type ContentBlock,
} from './anthropicClient';
import {
  deleteScript,
  forget,
  notebookText,
  remember,
  scriptNamed,
  writeScript,
} from './agentNotebook';
import { isMetaTool, META_TOOLS, toolDefinitions } from './agentTools';
import { performVerb } from './performVerb';
import { runScript, scriptRunText } from './scriptRunner';
import type { WorldAccess } from './serverWorld';
import { appendTranscript, sessionPose, type AgentSession, type AutopilotRun } from './sessions';

export type ToolInput = Record<string, unknown>;

export type MessageBlock = Record<string, unknown>;

const MAX_RESPONSE_TOKENS = 16000;
const HISTORY_MESSAGE_CAP = 40;
const RUNAWAY_TURN_CAP = 500;

export interface AutopilotOpts {
  goal: string;
  model: string;
  budgetUsd: number;
  apiKey: string | null;
}

interface Turn {
  session: AgentSession;
  access: WorldAccess;
  run: AutopilotRun;
}

interface ToolOutcome {
  text: string;
  log: string;
  isError: boolean;
}

export function startAutopilot(session: AgentSession, access: WorldAccess, opts: AutopilotOpts): void {
  session.run = {
    goal: opts.goal,
    model: opts.model,
    status: 'running',
    steps: 0,
    budgetUsd: opts.budgetUsd,
    spentUsd: 0,
    transcript: [],
    stopRequested: false,
  };
  void driveAgent(session, access, opts).catch((error) => {
    if (!session.run) return;
    appendTranscript(session.run, 'error', String(error));
    session.run.status = 'error';
  });
}

async function driveAgent(
  session: AgentSession,
  access: WorldAccess,
  opts: AutopilotOpts,
): Promise<void> {
  const run = session.run!;
  if (!opts.apiKey) return failWithoutKey(run);
  announceStart(run, opts);
  const turn: Turn = { session, access, run };
  const tools = toolDefinitions(session.mode);
  const frozenSystemPrompt = systemPrompt(access, session);
  const messages: AnthropicMessage[] = [
    { role: 'user', content: [{ type: 'text', text: openingTurn(turn, opts) }] },
  ];
  moveCacheBreakpointToNewestTurn(messages);
  for (let turnsTaken = 0; run.status === 'running'; turnsTaken += 1) {
    const halt = haltBeforeTurn(run, turnsTaken);
    if (halt) return endRun(run, halt.status, halt.note);
    const reply = await callAnthropic({
      apiKey: opts.apiKey,
      model: opts.model,
      maxTokens: MAX_RESPONSE_TOKENS,
      system: frozenSystemPrompt,
      tools,
      messages,
      onRetry: (note) => appendTranscript(run, 'status', note),
    });
    if (!reply.usage) return endRun(run, 'error', 'the API reported no token usage, so this run cannot be metered');
    run.spentUsd += usageCostUsd(run.model, reply.usage);
    messages.push({ role: 'assistant', content: reply.content });
    const toolUses = recordReply(run, reply);
    const stopped = haltingStopReason(reply.stop_reason);
    if (stopped) return endRun(run, stopped.status, stopped.note);
    if (reply.stop_reason === 'pause_turn') continue;
    if (toolUses.length === 0) return endRun(run, 'finished', 'the model ended its turn');
    const answered = answerEveryToolUse(turn, toolUses);
    if (answered.finished) return endRun(run, 'finished', answered.finished);
    messages.push({ role: 'user', content: answered.results });
    trimHistory(messages);
    moveCacheBreakpointToNewestTurn(messages);
  }
}

function failWithoutKey(run: AutopilotRun): void {
  appendTranscript(
    run,
    'error',
    'no Anthropic API key: pass anthropic_api_key in the run request or set ANTHROPIC_API_KEY on the server',
  );
  run.status = 'error';
}

function announceStart(run: AutopilotRun, opts: AutopilotOpts): void {
  appendTranscript(run, 'status', `run started: ${opts.goal} (${opts.model}, budget ${formatUsd(run.budgetUsd)})`);
  if (!modelIsPriced(opts.model)) {
    appendTranscript(
      run,
      'status',
      `no list price known for ${opts.model}; billing this run at the highest known rate, so the budget stops it early rather than late`,
    );
  }
}

function openingTurn(turn: Turn, opts: AutopilotOpts): string {
  return `Your goal: ${opts.goal}\n\nFirst observation:\n${observationBlock(turn)}`;
}

function haltBeforeTurn(
  run: AutopilotRun,
  turnsTaken: number,
): { status: 'stopped' | 'finished' | 'error'; note: string } | null {
  if (run.stopRequested) return { status: 'stopped', note: 'stopped by request' };
  if (budgetIsSpent(run)) return { status: 'finished', note: 'dollar budget spent' };
  if (turnsTaken >= RUNAWAY_TURN_CAP) {
    return { status: 'error', note: `stopped at the ${RUNAWAY_TURN_CAP}-turn runaway cap without spending the budget` };
  }
  return null;
}

function budgetIsSpent(run: AutopilotRun): boolean {
  return run.spentUsd >= run.budgetUsd;
}

function haltingStopReason(
  stopReason: string,
): { status: 'stopped' | 'error'; note: string } | null {
  if (stopReason === 'refusal') {
    return { status: 'stopped', note: 'the model declined to continue with this goal' };
  }
  if (stopReason === 'max_tokens') {
    return {
      status: 'error',
      note: `the model's reply hit the ${MAX_RESPONSE_TOKENS}-token cap and was cut off mid-turn`,
    };
  }
  if (stopReason === 'model_context_window_exceeded') {
    return { status: 'error', note: 'the conversation outgrew the context window' };
  }
  return null;
}

function endRun(run: AutopilotRun, status: 'stopped' | 'finished' | 'error', note: string): void {
  const entry = status === 'error' ? 'error' : 'status';
  appendTranscript(run, entry, `${note} — spent ${formatUsd(run.spentUsd)} of ${formatUsd(run.budgetUsd)}`);
  run.status = status;
}

function observe(session: AgentSession, access: WorldAccess): string {
  const world = access.current();
  return observationText(
    buildObservation(
      world.sampler,
      world.tileAssets,
      sessionPose(session),
      session.mode,
      session.sightRadiusTiles,
      world.puzzles,
    ),
  );
}

function systemPrompt(access: WorldAccess, session: AgentSession): string {
  return [
    `You are driving a ${session.mode}-mode agent in a procedurally generated world. Each tool below is one action in that world.`,
    'Act one step at a time; every tool result is a fresh observation. Call finish when the goal is done or clearly impossible.',
    'You keep a notebook across runs: remember saves a note, write_script saves an action sequence you can replay. Every observation repeats both back to you, so save what you would want at the start of a fresh run rather than a log of what you just did.',
    'Every observation also tells you what is left of your dollar budget. When the budget runs out the run stops wherever it stands, so spend it on the goal and record what you learned before it does.',
    'This prompt is written once at the start of a run. Where it describes the world — the tile legend especially — trust the observation in front of you over anything here.',
    session.mode === 'god'
      ? 'You can rebuild the world itself with the editing tools; inspect_pipeline and inspect_node_types show what exists and what you can add.'
      : '',
    '',
    buildApiDocs(access.current().tileAssets),
  ]
    .filter((line) => line !== '')
    .join('\n');
}

function recordReply(run: AutopilotRun, reply: AnthropicReply): ContentBlock[] {
  const toolUses: ContentBlock[] = [];
  for (const block of reply.content) {
    if (block.type === 'thinking' && block.thinking) appendTranscript(run, 'thinking', block.thinking);
    if (block.type === 'text' && block.text) appendTranscript(run, 'message', block.text);
    if (block.type === 'tool_use') {
      appendTranscript(run, 'tool_use', `${block.name} ${JSON.stringify(block.input)}`);
      toolUses.push(block);
    }
  }
  return toolUses;
}

function answerEveryToolUse(
  turn: Turn,
  toolUses: readonly ContentBlock[],
): { results: object[]; finished: string | null } {
  const results: object[] = [];
  for (const toolUse of toolUses) {
    if (toolUse.name === META_TOOLS.finish) {
      const summary = String((toolUse.input as { summary?: unknown } | undefined)?.summary ?? '');
      return { results, finished: `finished: ${summary}` };
    }
    results.push(toolResultBlock(turn, toolUse));
  }
  return { results, finished: null };
}

function toolResultBlock(turn: Turn, toolUse: ContentBlock): object {
  const outcome = toolOutcome(turn, toolUse);
  appendTranscript(turn.run, 'tool_result', outcome.log);
  return {
    type: 'tool_result',
    tool_use_id: toolUse.id,
    is_error: outcome.isError,
    content: outcome.text,
  };
}

function toolOutcome(turn: Turn, toolUse: ContentBlock): ToolOutcome {
  const input = (toolUse.input ?? {}) as ToolInput;
  const name = toolUse.name ?? '';
  if (isMetaTool(turn.session.mode, name)) return metaToolOutcome(turn, name, input);
  return worldActionOutcome(turn, name, input);
}

function worldActionOutcome(turn: Turn, action: string, input: ToolInput): ToolOutcome {
  const world = turn.access.current();
  const result = performVerb(turn.session, world, action, input, turn.access.lab);
  if (result.changedPipeline) turn.access.persistWorld(world);
  turn.run.steps += 1;
  const note = result.summary ?? result.failure?.hint ?? '';
  return {
    text: [
      `outcome: ${result.outcome}`,
      result.summary ? `summary: ${result.summary}` : '',
      result.failure ? `failure: ${result.failure.meaning} ${result.failure.hint ?? ''}` : '',
      '',
      observationBlock(turn),
    ]
      .filter((line) => line !== '')
      .join('\n'),
    log: `${result.outcome} at (${turn.session.x},${turn.session.y})${note ? ` — ${note}` : ''}`,
    isError: result.failure !== null,
  };
}

function metaToolOutcome(turn: Turn, name: string, input: ToolInput): ToolOutcome {
  if (name === META_TOOLS.inspectPipeline) {
    return readOnlyOutcome(JSON.stringify(pipelineJson(turn.access.current().store), null, 1), 'pipeline inspected');
  }
  if (name === META_TOOLS.inspectNodeTypes) {
    return readOnlyOutcome(JSON.stringify(nodeTypesJson(), null, 1), 'node types inspected');
  }
  return notebookOutcome(turn, name, input);
}

function notebookOutcome(turn: Turn, name: string, input: ToolInput): ToolOutcome {
  const { notebook, mode } = turn.session;
  if (name === META_TOOLS.remember) {
    return notebookEcho(turn, remember(notebook, String(input.note ?? '')));
  }
  if (name === META_TOOLS.forget) {
    return notebookEcho(turn, forget(notebook, String(input.id ?? '')));
  }
  if (name === META_TOOLS.deleteScript) {
    return notebookEcho(turn, deleteScript(notebook, String(input.name ?? '')));
  }
  if (name === META_TOOLS.writeScript) {
    const saved = writeScript(notebook, mode, {
      name: String(input.name ?? ''),
      description: String(input.description ?? ''),
      body: String(input.body ?? ''),
    });
    return saved.ok ? notebookEcho(turn, saved.summary) : failedOutcome(saved.hint);
  }
  if (name === META_TOOLS.runScript) {
    return runScriptOutcome(turn, String(input.name ?? ''));
  }
  return failedOutcome(`'${name}' is not a tool this agent has`);
}

function runScriptOutcome(turn: Turn, name: string): ToolOutcome {
  const script = scriptNamed(turn.session.notebook, name);
  if (!script) return failedOutcome(`no script called '${name}'`);
  const world = turn.access.current();
  const scriptRun = runScript(turn.session, world, script, turn.access.lab);
  if (scriptRun.changedPipeline) turn.access.persistWorld(world);
  turn.run.steps += scriptRun.actionsRun;
  const text = scriptRunText(scriptRun);
  return {
    text: `${text}\n\n${observationBlock(turn)}`,
    log: text,
    isError: scriptRun.fault !== null,
  };
}

function notebookEcho(turn: Turn, summary: string): ToolOutcome {
  return { text: `${summary}\n\n${observationBlock(turn)}`, log: summary, isError: false };
}

function readOnlyOutcome(text: string, log: string): ToolOutcome {
  return { text, log, isError: false };
}

function failedOutcome(hint: string): ToolOutcome {
  return { text: `outcome: failed\nfailure: ${hint}`, log: `failed — ${hint}`, isError: true };
}

function observationBlock(turn: Turn): string {
  return [
    observe(turn.session, turn.access),
    '',
    notebookText(turn.session.notebook),
    '',
    budgetLine(turn.run),
  ].join('\n');
}

function budgetLine(run: AutopilotRun): string {
  const remaining = Math.max(0, run.budgetUsd - run.spentUsd);
  const share = Math.round((remaining / run.budgetUsd) * 100);
  return `budget: ${formatUsd(remaining)} of ${formatUsd(run.budgetUsd)} left (${share}%). The run stops when it reaches zero.`;
}

function trimHistory(messages: AnthropicMessage[]): void {
  while (messages.length > HISTORY_MESSAGE_CAP) messages.splice(1, 2);
}

function moveCacheBreakpointToNewestTurn(messages: AnthropicMessage[]): void {
  for (const message of messages) {
    for (const block of blocksOf(message)) delete block.cache_control;
  }
  const blocks = blocksOf(messages[messages.length - 1]);
  const last = blocks[blocks.length - 1];
  if (last) last.cache_control = { type: 'ephemeral' };
}

function blocksOf(message: AnthropicMessage | undefined): MessageBlock[] {
  return Array.isArray(message?.content) ? (message.content as MessageBlock[]) : [];
}

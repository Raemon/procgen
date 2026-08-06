import { buildApiDocs } from '../apiDocs';
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

const MAX_RESPONSE_TOKENS = 4096;
const HISTORY_MESSAGE_CAP = 40;

export interface AutopilotOpts {
  goal: string;
  model: string;
  budgetUsd: number;
  apiKey: string | null;
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
  if (!opts.apiKey) {
    appendTranscript(
      run,
      'error',
      'no Anthropic API key: pass anthropic_api_key in the run request or set ANTHROPIC_API_KEY on the server',
    );
    run.status = 'error';
    return;
  }
  announceStart(run, opts);
  const tools = toolDefinitions(session.mode);
  const messages: AnthropicMessage[] = [
    { role: 'user', content: [{ type: 'text', text: openingTurn(session, access, opts) }] },
  ];
  moveCacheBreakpoint(messages);
  while (run.status === 'running') {
    if (run.stopRequested) return endRun(run, 'stopped', 'stopped by request');
    // Checked before the call, so the last turn can carry the run just past the
    // budget: the cap bounds what a run starts, not what it has already spent.
    if (run.spentUsd >= run.budgetUsd) return endRun(run, 'finished', 'dollar budget spent');
    const reply = await callAnthropic({
      apiKey: opts.apiKey,
      model: opts.model,
      maxTokens: MAX_RESPONSE_TOKENS,
      system: systemPrompt(access, session),
      tools,
      messages,
      onRetry: (note) => appendTranscript(run, 'status', note),
    });
    run.spentUsd += usageCostUsd(run.model, reply.usage);
    messages.push({ role: 'assistant', content: reply.content });
    const halt = haltingStopReason(reply.stop_reason);
    if (halt) return endRun(run, halt.status, halt.note);
    // A server-side tool paused the turn; re-sending the history resumes it.
    if (reply.stop_reason === 'pause_turn') continue;
    const toolUses = recordReply(run, reply);
    if (toolUses.length === 0) return endRun(run, 'finished', 'the model ended its turn');
    const turn = answerToolUses(session, access, run, toolUses);
    if (turn.finished) return endRun(run, 'finished', turn.finished);
    messages.push({ role: 'user', content: turn.results });
    trimHistory(messages);
    moveCacheBreakpoint(messages);
  }
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

function openingTurn(session: AgentSession, access: WorldAccess, opts: AutopilotOpts): string {
  return `Your goal: ${opts.goal}\n\nFirst observation:\n${observe(session, access)}`;
}

// stop_reasons that mean this run cannot continue. Anything not listed here is a
// normal turn (end_turn, tool_use) or resumable (pause_turn).
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
  return observationText(buildObservation(world.sampler, world.tileset, sessionPose(session), session.mode));
}

function systemPrompt(access: WorldAccess, session: AgentSession): string {
  return [
    `You are driving a ${session.mode}-mode agent in a procedurally generated world. Each tool below is one action in that world.`,
    'Act one step at a time; every tool result is a fresh observation. Call finish when the goal is done or clearly impossible.',
    'You keep a notebook across runs: remember saves a note, write_script saves an action sequence you can replay. Every observation repeats both back to you, so save what you would want at the start of a fresh run rather than a log of what you just did.',
    'Every observation also tells you what is left of your dollar budget. When the budget runs out the run stops wherever it stands, so spend it on the goal and record what you learned before it does.',
    session.mode === 'god'
      ? 'You can rebuild the world itself with the editing tools; inspect_pipeline and inspect_node_types show what exists and what you can add.'
      : '',
    '',
    buildApiDocs(access.current().tileset),
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

// The model may call several tools in one turn; every tool_use needs its own
// tool_result in the next message or the API rejects the whole conversation.
function answerToolUses(
  session: AgentSession,
  access: WorldAccess,
  run: AutopilotRun,
  toolUses: readonly ContentBlock[],
): { results: object[]; finished: string | null } {
  const results: object[] = [];
  for (const toolUse of toolUses) {
    if (toolUse.name === META_TOOLS.finish) {
      const summary = String((toolUse.input as { summary?: unknown } | undefined)?.summary ?? '');
      return { results, finished: `finished: ${summary}` };
    }
    results.push(toolResultBlock(session, access, run, toolUse));
  }
  return { results, finished: null };
}

function toolResultBlock(
  session: AgentSession,
  access: WorldAccess,
  run: AutopilotRun,
  toolUse: ContentBlock,
) {
  const outcome = toolOutcome(session, access, run, toolUse);
  appendTranscript(run, 'tool_result', outcome.log);
  return {
    type: 'tool_result',
    tool_use_id: toolUse.id,
    is_error: outcome.isError,
    content: outcome.text,
  };
}

interface ToolOutcome {
  text: string;
  log: string;
  isError: boolean;
}

function toolOutcome(
  session: AgentSession,
  access: WorldAccess,
  run: AutopilotRun,
  toolUse: ContentBlock,
): ToolOutcome {
  const input = (toolUse.input ?? {}) as Record<string, unknown>;
  const name = toolUse.name ?? '';
  if (isMetaTool(name)) return metaToolOutcome(session, access, run, name, input);
  const world = access.current();
  const result = performVerb(session, world, name, input);
  if (result.changedPipeline) access.persistWorld(world);
  run.steps += 1;
  const note = result.summary ?? result.failure?.hint ?? '';
  return {
    text: [
      `outcome: ${result.outcome}`,
      result.summary ? `summary: ${result.summary}` : '',
      result.failure ? `failure: ${result.failure.meaning} ${result.failure.hint ?? ''}` : '',
      '',
      observationBlock(session, access, run),
    ]
      .filter((line) => line !== '')
      .join('\n'),
    log: `${result.outcome} at (${session.x},${session.y})${note ? ` — ${note}` : ''}`,
    isError: result.failure !== null,
  };
}

function metaToolOutcome(
  session: AgentSession,
  access: WorldAccess,
  run: AutopilotRun,
  name: string,
  input: Record<string, unknown>,
): ToolOutcome {
  if (name === META_TOOLS.inspectPipeline) {
    return plainOutcome(JSON.stringify(pipelineJson(access.current().store), null, 1), 'pipeline inspected');
  }
  if (name === META_TOOLS.inspectNodeTypes) {
    return plainOutcome(JSON.stringify(nodeTypesJson(), null, 1), 'node types inspected');
  }
  return notebookOutcome(session, access, run, name, input);
}

function notebookOutcome(
  session: AgentSession,
  access: WorldAccess,
  run: AutopilotRun,
  name: string,
  input: Record<string, unknown>,
): ToolOutcome {
  const notebook = session.notebook;
  if (name === META_TOOLS.remember) {
    return notebookEcho(session, access, run, remember(notebook, String(input.note ?? '')));
  }
  if (name === META_TOOLS.forget) {
    return notebookEcho(session, access, run, forget(notebook, String(input.id ?? '')));
  }
  if (name === META_TOOLS.deleteScript) {
    return notebookEcho(session, access, run, deleteScript(notebook, String(input.name ?? '')));
  }
  if (name === META_TOOLS.writeScript) {
    const saved = writeScript(notebook, {
      name: String(input.name ?? ''),
      description: String(input.description ?? ''),
      body: String(input.body ?? ''),
    });
    if (!saved.ok) return failedOutcome(saved.hint);
    return notebookEcho(session, access, run, saved.summary);
  }
  if (name === META_TOOLS.runScript) {
    return runScriptOutcome(session, access, run, String(input.name ?? ''));
  }
  return failedOutcome(`'${name}' is not a tool this agent has`);
}

function runScriptOutcome(
  session: AgentSession,
  access: WorldAccess,
  run: AutopilotRun,
  name: string,
): ToolOutcome {
  const script = scriptNamed(session.notebook, name);
  if (!script) return failedOutcome(`no script called '${name}'`);
  const world = access.current();
  const scriptRun = runScript(session, world, script);
  if (scriptRun.changedPipeline) access.persistWorld(world);
  run.steps += scriptRun.actionsRun;
  const text = scriptRunText(scriptRun);
  return {
    text: `${text}\n\n${observationBlock(session, access, run)}`,
    log: text,
    isError: scriptRun.failure !== null,
  };
}

function notebookEcho(
  session: AgentSession,
  access: WorldAccess,
  run: AutopilotRun,
  summary: string,
): ToolOutcome {
  return { text: `${summary}\n\n${observationBlock(session, access, run)}`, log: summary, isError: false };
}

function plainOutcome(text: string, log: string): ToolOutcome {
  return { text, log, isError: false };
}

function failedOutcome(hint: string): ToolOutcome {
  return { text: `outcome: failed\nfailure: ${hint}`, log: `failed — ${hint}`, isError: true };
}

// Everything the agent should have in front of it every turn: where it is, what it
// remembers, what it can replay, and what it has left to spend.
function observationBlock(session: AgentSession, access: WorldAccess, run: AutopilotRun): string {
  return [observe(session, access), '', notebookText(session.notebook), '', budgetLine(run)].join('\n');
}

function budgetLine(run: AutopilotRun): string {
  const remaining = Math.max(0, run.budgetUsd - run.spentUsd);
  const share = Math.round((remaining / run.budgetUsd) * 100);
  return `budget: ${formatUsd(remaining)} of ${formatUsd(run.budgetUsd)} left (${share}%). The run stops when it reaches zero.`;
}

// Drops whole assistant/tool_result pairs from the front, keeping the goal turn.
// What the agent wanted to keep is in its notebook, which is re-sent every turn.
function trimHistory(messages: AnthropicMessage[]): void {
  while (messages.length > HISTORY_MESSAGE_CAP) messages.splice(1, 2);
}

// One breakpoint, always on the newest turn, so each request reads the whole
// conversation before it out of cache. Old markers are cleared as it moves —
// a breakpoint is an annotation, not content, so moving it invalidates nothing.
function moveCacheBreakpoint(messages: readonly AnthropicMessage[]): void {
  for (const message of messages) {
    for (const block of blocksOf(message)) delete block.cache_control;
  }
  const blocks = blocksOf(messages[messages.length - 1]);
  const last = blocks[blocks.length - 1];
  if (last) last.cache_control = { type: 'ephemeral' };
}

function blocksOf(message: AnthropicMessage | undefined): Record<string, unknown>[] {
  return Array.isArray(message?.content) ? (message.content as Record<string, unknown>[]) : [];
}

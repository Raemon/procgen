import { performVerb, type VerbResult } from './performVerb';
import type { ServerWorld } from './serverWorld';
import type { AgentSession } from './sessions';
import type { SavedScript } from './agentNotebook';

// A script is a list of world actions, not code: we parse it ourselves and hand
// each line to the same performVerb the HTTP API uses. Nothing here can reach the
// filesystem, the network, or the server process — a script can only do what the
// agent could already do one action at a time.
const MAX_ACTIONS_PER_RUN = 200;
const MAX_REPEAT = 100;

export interface ScriptRun {
  actionsRun: number;
  changedPipeline: boolean;
  failure: { line: number; text: string; reason: string } | null;
  summary: string;
}

interface ScriptLine {
  line: number;
  text: string;
  repeat: number;
  action: string;
  params: Record<string, unknown>;
}

export function runScript(
  session: AgentSession,
  world: ServerWorld,
  script: SavedScript,
): ScriptRun {
  const parsed = parseScript(script.body);
  if (!parsed.ok) {
    return { actionsRun: 0, changedPipeline: false, failure: parsed.failure, summary: 'script did not run' };
  }
  return executeLines(session, world, script, parsed.lines);
}

function executeLines(
  session: AgentSession,
  world: ServerWorld,
  script: SavedScript,
  lines: readonly ScriptLine[],
): ScriptRun {
  let actionsRun = 0;
  let changedPipeline = false;
  for (const line of lines) {
    for (let pass = 0; pass < line.repeat; pass += 1) {
      if (actionsRun >= MAX_ACTIONS_PER_RUN) {
        return {
          actionsRun,
          changedPipeline,
          failure: {
            line: line.line,
            text: line.text,
            reason: `a script may run at most ${MAX_ACTIONS_PER_RUN} actions`,
          },
          summary: `'${script.name}' stopped at its action limit`,
        };
      }
      const result = performVerb(session, world, line.action, line.params);
      actionsRun += 1;
      changedPipeline = changedPipeline || result.changedPipeline;
      if (result.failure) {
        return {
          actionsRun,
          changedPipeline,
          failure: { line: line.line, text: line.text, reason: failureText(result) },
          summary: `'${script.name}' stopped after ${actionsRun} action(s)`,
        };
      }
    }
  }
  return {
    actionsRun,
    changedPipeline,
    failure: null,
    summary: `'${script.name}' ran ${actionsRun} action(s)`,
  };
}

function failureText(result: VerbResult): string {
  const failure = result.failure!;
  return `${failure.code}: ${failure.meaning}${failure.hint ? ` ${failure.hint}` : ''}`;
}

type ParseResult =
  | { ok: true; lines: ScriptLine[] }
  | { ok: false; failure: { line: number; text: string; reason: string } };

function parseScript(body: string): ParseResult {
  const lines: ScriptLine[] = [];
  const rawLines = body.split('\n');
  for (let index = 0; index < rawLines.length; index += 1) {
    const text = stripComment(rawLines[index] ?? '').trim();
    if (text === '') continue;
    const parsed = parseLine(text);
    if (!parsed.ok) return { ok: false, failure: { line: index + 1, text, reason: parsed.reason } };
    lines.push({ ...parsed.line, line: index + 1, text });
  }
  if (lines.length === 0) return { ok: false, failure: { line: 1, text: '', reason: 'the script is empty' } };
  return { ok: true, lines };
}

type LineParse =
  | { ok: true; line: Omit<ScriptLine, 'line' | 'text'> }
  | { ok: false; reason: string };

function parseLine(text: string): LineParse {
  const tokens = tokenize(text);
  let repeat = 1;
  if (tokens[0] === 'repeat') {
    const count = Number(tokens[1]);
    if (!Number.isInteger(count) || count < 1 || count > MAX_REPEAT) {
      return { ok: false, reason: `repeat takes a whole number from 1 to ${MAX_REPEAT}` };
    }
    repeat = count;
    tokens.splice(0, 2);
  }
  const action = tokens.shift();
  if (!action) return { ok: false, reason: 'no action on this line' };
  const params: Record<string, unknown> = {};
  for (const token of tokens) {
    const split = token.indexOf('=');
    if (split <= 0) return { ok: false, reason: `'${token}' is not a key=value param` };
    params[token.slice(0, split)] = parseValue(token.slice(split + 1));
  }
  return { ok: true, line: { repeat, action, params } };
}

function stripComment(line: string): string {
  const hash = line.indexOf('#');
  return hash === -1 ? line : line.slice(0, hash);
}

// Splits on whitespace but keeps quoted runs together, so `description="two words"`
// survives as one token.
function tokenize(text: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let quoted = false;
  for (const char of text) {
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (!quoted && /\s/.test(char)) {
      if (current !== '') tokens.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  if (current !== '') tokens.push(current);
  return tokens;
}

function parseValue(raw: string): unknown {
  if (raw.startsWith('{') || raw.startsWith('[')) {
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      return raw;
    }
  }
  if (raw !== '' && Number.isFinite(Number(raw))) return Number(raw);
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return raw;
}

export function scriptRunText(run: ScriptRun): string {
  if (!run.failure) return run.summary;
  return `${run.summary}; line ${run.failure.line} ('${run.failure.text}') failed — ${run.failure.reason}`;
}

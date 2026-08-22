import type { CommandParams } from '@/features/app-shell/runtime/commands/command';
import { commandFor } from '@/features/app-shell/runtime/commands/commandCatalog';
import { listOf } from '@/features/app-shell/runtime/commands/commandParams';
import type { CommandMode } from '@/features/app-shell/runtime/commands/command';

const MAX_REPEAT = 100;

export interface ScriptLine {
  line: number;
  text: string;
  repeat: number;
  action: string;
  params: CommandParams;
}

export interface ScriptFault {
  line: number;
  text: string;
  reason: string;
}

export type ScriptParse = { ok: true; lines: ScriptLine[] } | { ok: false; fault: ScriptFault };

export function parseScript(body: string): ScriptParse {
  const lines: ScriptLine[] = [];
  const rawLines = body.split('\n');
  for (let index = 0; index < rawLines.length; index += 1) {
    const text = (rawLines[index] ?? '').trim();
    const tokens = tokenize(text);
    if (tokens.length === 0) continue;
    const parsed = parseTokens(tokens);
    if (!parsed.ok) return { ok: false, fault: { line: index + 1, text, reason: parsed.reason } };
    lines.push({ ...parsed.line, line: index + 1, text });
  }
  if (lines.length === 0) return { ok: false, fault: { line: 1, text: '', reason: 'the script is empty' } };
  return { ok: true, lines };
}

export function parseScriptForMode(mode: CommandMode, body: string): ScriptParse {
  const parsed = parseScript(body);
  if (!parsed.ok) return parsed;
  for (const line of parsed.lines) {
    const reason = lineFault(mode, line);
    if (reason) return { ok: false, fault: { line: line.line, text: line.text, reason } };
  }
  return parsed;
}

export function scriptFaultText(fault: ScriptFault): string {
  return `line ${fault.line} ('${fault.text}') — ${fault.reason}`;
}

function lineFault(mode: CommandMode, line: ScriptLine): string | null {
  const spec = commandFor(mode, line.action);
  if (!spec) {
    return `'${line.action}' is not a ${mode}-mode action`;
  }
  const declared = Object.keys(spec.params);
  const unknown = Object.keys(line.params).filter((name) => !declared.includes(name));
  if (unknown.length > 0) {
    return `${listOf(unknown)} is not a param of '${line.action}'. It takes: ${listOf(declared)}`;
  }
  const missing = declared.filter(
    (name) => !spec.params[name]?.optional && line.params[name] === undefined,
  );
  return missing.length > 0 ? `'${line.action}' also needs: ${listOf(missing)}` : null;
}

type TokenParse = { ok: true; line: Omit<ScriptLine, 'line' | 'text'> } | { ok: false; reason: string };

function parseTokens(tokens: Token[]): TokenParse {
  const rest = [...tokens];
  let repeat = 1;
  if (rest[0]?.text === 'repeat' && !rest[0].quoted) {
    const count = Number(rest[1]?.text);
    if (!Number.isInteger(count) || count < 1 || count > MAX_REPEAT) {
      return { ok: false, reason: `repeat takes a whole number from 1 to ${MAX_REPEAT}` };
    }
    repeat = count;
    rest.splice(0, 2);
  }
  const action = rest.shift();
  if (!action) return { ok: false, reason: 'no action on this line' };
  const params: CommandParams = {};
  for (const token of rest) {
    const split = token.text.indexOf('=');
    if (split <= 0) return { ok: false, reason: `'${token.text}' is not a key=value param` };
    params[token.text.slice(0, split)] = paramValue(token.text.slice(split + 1), token.quoted);
  }
  return { ok: true, line: { repeat, action: action.text, params } };
}

interface Token {
  text: string;
  quoted: boolean;
}

function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  let current = '';
  let quoted = false;
  let everQuoted = false;
  let jsonDepth = 0;
  const flush = () => {
    if (current !== '' || everQuoted) tokens.push({ text: current, quoted: everQuoted });
    current = '';
    everQuoted = false;
  };
  for (const char of text) {
    if (jsonDepth > 0) {
      if (char === '{' || char === '[') jsonDepth += 1;
      if (char === '}' || char === ']') jsonDepth -= 1;
      current += char;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      everQuoted = true;
      continue;
    }
    if (!quoted && (char === '{' || char === '[')) {
      jsonDepth = 1;
      current += char;
      continue;
    }
    if (!quoted && char === '#') break;
    if (!quoted && /\s/.test(char)) {
      flush();
      continue;
    }
    current += char;
  }
  flush();
  return tokens;
}

function paramValue(raw: string, quoted: boolean): unknown {
  if (quoted) return raw;
  if (raw.startsWith('{') || raw.startsWith('[')) return jsonValue(raw);
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (raw !== '' && Number.isFinite(Number(raw))) return Number(raw);
  return raw;
}

function jsonValue(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
}

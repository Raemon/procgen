import type { ChunkGenCtx } from '../../nodeType';

export type ScriptFn = (ctx: ChunkGenCtx) => unknown;

const compiled = new Map<string, ScriptFn>();

export function compileScript(code: string): ScriptFn {
  const cached = compiled.get(code);
  if (cached) return cached;
  const fn = new Function('ctx', `"use strict";\n${code}`) as ScriptFn;
  compiled.set(code, fn);
  return fn;
}

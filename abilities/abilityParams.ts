import { abilityFailed, type AbilityResult } from './ability';

export type ParamRead<T> = { ok: true; value: T } | { ok: false; failure: AbilityResult };

export function readText(params: Record<string, unknown>, name: string): ParamRead<string> {
  const raw = params[name];
  if (typeof raw !== 'string' || raw.trim() === '') {
    return badValue(name, 'a non-empty string');
  }
  return { ok: true, value: raw.trim() };
}

export function readOptionalText(params: Record<string, unknown>, name: string): string {
  const raw = params[name];
  return typeof raw === 'string' ? raw : '';
}

export function readNumber(params: Record<string, unknown>, name: string): ParamRead<number> {
  const raw = params[name];
  const value = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : NaN;
  return Number.isFinite(value) ? { ok: true, value } : badValue(name, 'a number');
}

export function readInt(params: Record<string, unknown>, name: string): ParamRead<number> {
  const read = readNumber(params, name);
  return read.ok ? { ok: true, value: Math.round(read.value) } : read;
}

export function readOptionalInt(
  params: Record<string, unknown>,
  name: string,
  fallback: number,
): number {
  const read = readNumber(params, name);
  return read.ok ? Math.round(read.value) : fallback;
}

export function badValue(name: string, expected: string): { ok: false; failure: AbilityResult } {
  return { ok: false, failure: abilityFailed('invalid_value', `'${name}' takes ${expected}`) };
}

export function listOf(names: readonly (string | number)[]): string {
  return names.length > 0 ? names.join(', ') : '(none)';
}

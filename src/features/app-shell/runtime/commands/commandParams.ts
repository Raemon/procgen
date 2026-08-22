import type { CommandParams } from '@/features/app-shell/runtime/commands/command';
import { assetId, type AssetIdOf, type AssetKind } from '@/features/asset-library/asset';
import { commandFailed, type CommandResult } from './command';

export type ParamRead<T> = { ok: true; value: T } | { ok: false; failure: CommandResult };

export function readText(params: CommandParams, name: string): ParamRead<string> {
  const raw = params[name];
  if (typeof raw !== 'string' || raw.trim() === '') {
    return badValue(name, 'a non-empty string');
  }
  return { ok: true, value: raw.trim() };
}

export function readOptionalText(params: CommandParams, name: string): string {
  const raw = params[name];
  return typeof raw === 'string' ? raw : '';
}

export function readNumber(params: CommandParams, name: string): ParamRead<number> {
  const raw = params[name];
  const value = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : NaN;
  return Number.isFinite(value) ? { ok: true, value } : badValue(name, 'a number');
}

export function readInt(params: CommandParams, name: string): ParamRead<number> {
  const read = readNumber(params, name);
  return read.ok ? { ok: true, value: Math.round(read.value) } : read;
}

export function readAssetId<Kind extends AssetKind>(
  params: CommandParams,
  name: string,
): ParamRead<AssetIdOf<Kind>> {
  const read = readInt(params, name);
  return read.ok ? { ok: true, value: assetId<Kind>(read.value) } : read;
}

export function readOptionalAssetId<Kind extends AssetKind>(
  params: CommandParams,
  name: string,
  fallback: AssetIdOf<Kind>,
): AssetIdOf<Kind> {
  return assetId<Kind>(readOptionalInt(params, name, fallback));
}

export function readOptionalInt(
  params: CommandParams,
  name: string,
  fallback: number,
): number {
  const read = readNumber(params, name);
  return read.ok ? Math.round(read.value) : fallback;
}

export function badValue(name: string, expected: string): { ok: false; failure: CommandResult } {
  return { ok: false, failure: commandFailed('invalid_value', `'${name}' takes ${expected}`) };
}

export function listOf(names: readonly (string | number)[]): string {
  return names.length > 0 ? names.join(', ') : '(none)';
}

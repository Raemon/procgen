import { PERSISTED_UI_KEYS } from '@/features/app-shell/state/persistedUiKeys';
import { persistedUiValue, writePersistedUiValue } from '@/features/app-shell/state/persistedUiStore';
import type { PersistedUiState } from '@/features/app-shell/persistence/persistedDocumentContents';
import { NOTHING_RUNNING, runningSeed, type RunningWorld, type RunningWorldRef } from './runningWorld';

const KEY_BEFORE_THE_WORLD_SEED_RENAME = 'library.runningWorld';

const NEVER_WRITTEN = Symbol('never written');

export function loadRunningWorld(): RunningWorldRef | null {
  const held = persistedUiValue<unknown>(PERSISTED_UI_KEYS.runningWorld, NEVER_WRITTEN, anything);
  if (held !== NEVER_WRITTEN) return runningWorldRefFrom(held);
  return runningWorldRefFrom(
    persistedUiValue<unknown>(KEY_BEFORE_THE_WORLD_SEED_RENAME, NEVER_WRITTEN, anything),
  );
}

export function attachRunningWorldPersistence(runningWorld: RunningWorld): void {
  runningWorld.onChange(() =>
    writePersistedUiValue(PERSISTED_UI_KEYS.runningWorld, runningWorld.ref()),
  );
}

export function runningWorldIn(uiState: PersistedUiState): RunningWorldRef | null {
  if (PERSISTED_UI_KEYS.runningWorld in uiState) {
    return runningWorldRefFrom(uiState[PERSISTED_UI_KEYS.runningWorld]);
  }
  return runningWorldRefFrom(uiState[KEY_BEFORE_THE_WORLD_SEED_RENAME]);
}

export function runningWorldRefFrom(raw: unknown): RunningWorldRef | null {
  if (typeof raw === 'string') return raw === '' ? NOTHING_RUNNING : runningSeed(raw);
  if (typeof raw !== 'object' || raw === null) return NOTHING_RUNNING;
  const held = raw as { kind?: unknown; name?: unknown };
  if (typeof held.name !== 'string' || held.name === '') return NOTHING_RUNNING;
  if (held.kind !== 'seed' && held.kind !== 'saved') return NOTHING_RUNNING;
  return { kind: held.kind, name: held.name };
}

function anything(value: unknown): value is unknown {
  return value !== undefined;
}

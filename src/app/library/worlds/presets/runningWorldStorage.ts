import { PERSISTED_UI_KEYS } from '../../frontend/uiState/persistedUiKeys';
import { persistedUiValue, writePersistedUiValue } from '../../frontend/uiState/persistedUiStore';
import type { RunningWorld } from './runningWorld';

export function loadRunningWorldName(): string {
  return persistedUiValue(PERSISTED_UI_KEYS.runningWorld, '', isWorldName);
}

export function attachRunningWorldPersistence(runningWorld: RunningWorld): void {
  runningWorld.onChange(() =>
    writePersistedUiValue(PERSISTED_UI_KEYS.runningWorld, runningWorld.name()),
  );
}

export function runningWorldNameIn(uiState: unknown): string {
  const held = (uiState ?? {}) as Record<string, unknown>;
  const name = held[PERSISTED_UI_KEYS.runningWorld];
  return isWorldName(name) ? name : '';
}

function isWorldName(value: unknown): value is string {
  return typeof value === 'string';
}

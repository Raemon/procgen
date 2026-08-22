import { PERSISTED_UI_KEYS } from '@/features/app-shell/state/persistedUiKeys';
import { persistedUiValue, writePersistedUiValue } from '@/features/app-shell/state/persistedUiStore';
import type { PersistedUiState } from '@/features/app-shell/persistence/persistedDocumentContents';
import type { RunningWorld } from './runningWorld';

export type WorldName = string;

export const NO_RUNNING_WORLD: WorldName = '';

export function loadRunningWorldName(): WorldName {
  return persistedUiValue(PERSISTED_UI_KEYS.runningWorld, NO_RUNNING_WORLD, isWorldName);
}

export function attachRunningWorldPersistence(runningWorld: RunningWorld): void {
  runningWorld.onChange(() =>
    writePersistedUiValue(PERSISTED_UI_KEYS.runningWorld, runningWorld.name()),
  );
}

export function runningWorldNameIn(uiState: PersistedUiState): WorldName {
  const name = uiState[PERSISTED_UI_KEYS.runningWorld];
  return isWorldName(name) ? name : NO_RUNNING_WORLD;
}

function isWorldName(value: unknown): value is WorldName {
  return typeof value === 'string';
}

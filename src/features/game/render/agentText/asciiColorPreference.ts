import {
  persistedUiValue,
  subscribeToPersistedUiValue,
  writePersistedUiValue,
} from '@/features/app-shell/state/persistedUiStore';

const ASCII_COLOR_KEY = 'worldView.asciiColor';

export function asciiColorOn(): boolean {
  return persistedUiValue(ASCII_COLOR_KEY, false, isBoolean);
}

export function setAsciiColorOn(on: boolean): void {
  writePersistedUiValue(ASCII_COLOR_KEY, on);
}

export function onAsciiColorChange(listener: () => void): () => void {
  return subscribeToPersistedUiValue(ASCII_COLOR_KEY, listener);
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

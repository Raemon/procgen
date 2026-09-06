import {
  persistedUiValue,
  subscribeToPersistedUiValue,
  writePersistedUiValue,
} from '@/features/app-shell/state/persistedUiStore';

const SOUND_KEY = 'game.sound';

export const SOUND_DEFAULT = true;

export function soundOn(): boolean {
  return persistedUiValue(SOUND_KEY, SOUND_DEFAULT, isBoolean);
}

export function setSoundOn(on: boolean): void {
  writePersistedUiValue(SOUND_KEY, on);
}

export function onSoundChange(listener: () => void): () => void {
  return subscribeToPersistedUiValue(SOUND_KEY, listener);
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

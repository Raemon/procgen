import { persistedUiValue } from '@/features/app-shell/state/persistedUiStore';
import { usePersistedUiValue } from '@/features/app-shell/state/usePersistedUiValue';

const SOUND_KEY = 'game.sound';
const SOUND_DEFAULT = true;

export function soundOn(): boolean {
  return persistedUiValue(SOUND_KEY, SOUND_DEFAULT, isBoolean);
}

export function useSoundOn(): [boolean, (on: boolean) => void] {
  return usePersistedUiValue(SOUND_KEY, SOUND_DEFAULT, isBoolean);
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

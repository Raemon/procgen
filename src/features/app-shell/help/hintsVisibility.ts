import { isBoolean } from '@/features/app-shell/state/persistedUiGuards';
import { PERSISTED_UI_KEYS } from '@/features/app-shell/state/persistedUiKeys';
import { usePersistedUiValue } from '@/features/app-shell/state/usePersistedUiValue';

const HINTS_START_HIDDEN = false;

export function useHintsVisible(): [boolean, (visible: boolean) => void] {
  return usePersistedUiValue<boolean>(
    PERSISTED_UI_KEYS.hintsVisible,
    HINTS_START_HIDDEN,
    isBoolean,
  );
}

import { isBoolean } from '../uiState/persistedUiGuards';
import { PERSISTED_UI_KEYS } from '../uiState/persistedUiKeys';
import { usePersistedUiValue } from '../uiState/usePersistedUiValue';

const HINTS_START_HIDDEN = false;

export function useHintsVisible(): [boolean, (visible: boolean) => void] {
  return usePersistedUiValue<boolean>(
    PERSISTED_UI_KEYS.hintsVisible,
    HINTS_START_HIDDEN,
    isBoolean,
  );
}

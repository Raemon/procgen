import { useCallback } from 'react';
import { PERSISTED_UI_KEYS } from '../frontend/uiState/persistedUiKeys';
import { usePersistedUiValue } from '../frontend/uiState/usePersistedUiValue';
import {
  isLibrarySelection,
  WORLD_SELECTED,
  type LibraryFolder,
  type LibrarySelection,
} from './librarySelection';

export function useLibrarySelection(): [LibrarySelection, (folder: LibraryFolder, key: string) => void] {
  const [selection, setSelection] = usePersistedUiValue<LibrarySelection>(
    PERSISTED_UI_KEYS.librarySelection,
    WORLD_SELECTED,
    isLibrarySelection,
  );
  const select = useCallback(
    (folder: LibraryFolder, key: string) => setSelection({ folder, key }),
    [setSelection],
  );
  return [selection, select];
}

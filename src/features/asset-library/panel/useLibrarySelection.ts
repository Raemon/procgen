import { useCallback } from 'react';
import { PERSISTED_UI_KEYS } from '@/features/app-shell/state/persistedUiKeys';
import { usePersistedUiValue } from '@/features/app-shell/state/usePersistedUiValue';
import {
  isLibrarySelection,
  NOTHING_SELECTED,
  selects,
  type LibraryFolder,
  type LibrarySelection,
} from '../librarySelection';

export interface LibrarySelecting {
  selection: LibrarySelection | null;
  select(folder: LibraryFolder, key: string): void;
  toggle(folder: LibraryFolder, key: string): void;
  clear(): void;
}

export function useLibrarySelection(): LibrarySelecting {
  const [selection, setSelection] = usePersistedUiValue<LibrarySelection | null>(
    PERSISTED_UI_KEYS.librarySelection,
    NOTHING_SELECTED,
    isLibrarySelection,
  );
  const select = useCallback(
    (folder: LibraryFolder, key: string) => setSelection({ folder, key }),
    [setSelection],
  );
  const toggle = useCallback(
    (folder: LibraryFolder, key: string) =>
      setSelection(selects(selection, folder, key) ? NOTHING_SELECTED : { folder, key }),
    [selection, setSelection],
  );
  const clear = useCallback(() => setSelection(NOTHING_SELECTED), [setSelection]);
  return { selection, select, toggle, clear };
}

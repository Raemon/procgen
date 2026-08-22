import type { PanelKey } from '@/features/app-shell/layout/usePanelLayout';
import { PERSISTED_UI_KEYS } from '@/features/app-shell/state/persistedUiKeys';
import { usePersistedUiSet } from '@/features/app-shell/state/usePersistedUiSet';
import { usePersistedUiValue } from '@/features/app-shell/state/usePersistedUiValue';
import {
  isLibrarySelection,
  nextSelectionOnOpen,
  NOTHING_SELECTED,
  type LibraryFolder,
  type LibrarySelection,
} from '../librarySelection';

const DETAIL_COLUMN: PanelKey = 'detail';

export interface LibrarySelecting {
  selection: LibrarySelection | null;
  select(folder: LibraryFolder, key: string): void;
  open(folder: LibraryFolder, key: string): void;
  clear(): void;
}

export function useLibrarySelection(): LibrarySelecting {
  const [selection, setSelection] = usePersistedUiValue<LibrarySelection | null>(
    PERSISTED_UI_KEYS.librarySelection,
    NOTHING_SELECTED,
    isLibrarySelection,
  );
  const collapsed = usePersistedUiSet(PERSISTED_UI_KEYS.collapsedPanels);

  function showDetailColumn(open: boolean): void {
    if (collapsed.has(DETAIL_COLUMN) === open) collapsed.toggle(DETAIL_COLUMN);
  }

  return {
    selection,
    select: (folder, key) => {
      setSelection({ folder, key });
      showDetailColumn(true);
    },
    open: (folder, key) => {
      const opened = nextSelectionOnOpen(selection, folder, key);
      setSelection(opened.selection);
      showDetailColumn(opened.detailIsOpen);
    },
    clear: () => setSelection(NOTHING_SELECTED),
  };
}

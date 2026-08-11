import { PIECE_ROLES } from '../../../assets/pieces/pieceDef';
import { piecesBoundToRole, type Culture } from '../../../assets/cultures/cultureDef';
import { useAppRuntime } from '../../../frontend/appRuntimeContext';
import { useRerenderOnCultureChange } from '../../../frontend/rerenderHooks';
import { forgetOpenPanelOfRow } from '../../../frontend/uiState/forgetOpenPanelOfRow';
import { PERSISTED_UI_KEYS } from '../../../frontend/uiState/persistedUiKeys';
import { CultureIcon } from '../icons/CultureIcon';
import type { LibraryEntry } from './libraryEntry';

export function useCultureEntries(): LibraryEntry[] {
  const { cultures, perform } = useAppRuntime();
  useRerenderOnCultureChange();
  return cultures.all().map((culture) => ({
    key: String(culture.id),
    name: culture.name,
    icon: <CultureIcon culture={culture} />,
    tip: { title: culture.name, body: `culture ${culture.id} · ${boundRolesOf(culture)}` },
    duplicate: () => perform('duplicate_culture', { culture_id: culture.id }),
    remove: () => {
      forgetOpenPanelOfRow(PERSISTED_UI_KEYS.openCulturePanels, culture.id);
      perform('remove_culture', { culture_id: culture.id });
    },
  }));
}

function boundRolesOf(culture: Culture): string {
  const bound = PIECE_ROLES.filter((role) => piecesBoundToRole(culture, role).length > 0);
  return bound.length > 0 ? `pieces bound: ${bound.join(', ')}` : 'built from tiles alone';
}

import { createContext, type ReactNode, useContext } from 'react';
import { PERSISTED_UI_KEYS } from '@/features/app-shell/state/persistedUiKeys';
import { usePersistedUiValue } from '@/features/app-shell/state/usePersistedUiValue';
import { ASSET_ICON_PX } from './icons/AssetIconFrame';

export const LIBRARY_VIEW_MODES = ['rows', 'grid'] as const;
export type LibraryViewMode = (typeof LIBRARY_VIEW_MODES)[number];
export const LIBRARY_GRID_PREVIEW_PX = ASSET_ICON_PX * 2;

const LibraryViewModeContext = createContext<LibraryViewMode>('rows');

export function isLibraryViewMode(value: unknown): value is LibraryViewMode {
  return LIBRARY_VIEW_MODES.includes(value as LibraryViewMode);
}

export function usePersistedLibraryViewMode(): [
  LibraryViewMode,
  (mode: LibraryViewMode) => void,
] {
  return usePersistedUiValue(PERSISTED_UI_KEYS.libraryViewMode, 'rows', isLibraryViewMode);
}

export function LibraryViewModeProvider({
  mode,
  children,
}: {
  mode: LibraryViewMode;
  children: ReactNode;
}) {
  return <LibraryViewModeContext value={mode}>{children}</LibraryViewModeContext>;
}

export function useLibraryViewMode(): LibraryViewMode {
  return useContext(LibraryViewModeContext);
}

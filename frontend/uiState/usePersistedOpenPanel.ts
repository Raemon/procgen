import { isOneOf } from './persistedUiGuards';
import { usePersistedUiRecord } from './usePersistedUiRecord';

export interface OpenPanelOfRow<Panel extends string> {
  openPanel: Panel | 'none';
  toggle(panel: Panel): void;
  forgetRow(): void;
}

export function usePersistedOpenPanel<Panel extends string>(
  key: string,
  panels: readonly (Panel | 'none')[],
  rowId: number,
): OpenPanelOfRow<Panel> {
  const openPanels = usePersistedUiRecord(key, isOneOf(panels));
  const openPanel = openPanels.valueOf(String(rowId)) ?? 'none';
  return {
    openPanel,
    toggle: (panel) => openPanels.set(String(rowId), openPanel === panel ? 'none' : panel),
    forgetRow: () => openPanels.forget(String(rowId)),
  };
}

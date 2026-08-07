import { useCallback } from 'react';
import { isNumber, isRecordOf } from '../ui/uiState/persistedUiGuards';
import { usePersistedUiSet } from '../ui/uiState/usePersistedUiSet';
import { PERSISTED_UI_KEYS } from '../ui/uiState/persistedUiKeys';
import { usePersistedUiValue } from '../ui/uiState/usePersistedUiValue';

export type PanelKey = 'library' | 'procgen' | 'agents' | 'log';

const MIN_PANEL_WIDTH = 150;
const MAX_PANEL_WIDTH = 640;
const HANDLE_WIDTH = 6;
export const COLLAPSED_PANEL_WIDTH = 30;

const START_WIDTHS: Readonly<Record<PanelKey, number>> = {
  library: 240,
  procgen: 280,
  agents: 250,
  log: 270,
};

export interface PanelLayout {
  gridTemplateColumns: string;
  widthOf(key: PanelKey): number;
  isCollapsed(key: PanelKey): boolean;
  resizePanel(key: PanelKey, width: number): void;
  toggleCollapsed(key: PanelKey): void;
}

export function usePanelLayout(visible: readonly PanelKey[]): PanelLayout {
  const [widths, setWidths] = usePersistedUiValue<Partial<Record<PanelKey, number>>>(
    PERSISTED_UI_KEYS.panelWidths,
    START_WIDTHS,
    isRecordOf(isNumber),
  );
  const collapsed = usePersistedUiSet(PERSISTED_UI_KEYS.collapsedPanels);

  const resizePanel = useCallback(
    (key: PanelKey, width: number) => setWidths({ ...widths, [key]: clamped(width) }),
    [widths, setWidths],
  );

  const isCollapsed = (key: PanelKey) => collapsed.has(key);
  const widthOf = (key: PanelKey) =>
    isCollapsed(key) ? COLLAPSED_PANEL_WIDTH : (widths[key] ?? START_WIDTHS[key]);

  return {
    gridTemplateColumns: columnTemplate(visible.map(widthOf)),
    widthOf,
    isCollapsed,
    resizePanel,
    toggleCollapsed: (key) => collapsed.toggle(key),
  };
}

function columnTemplate(widths: readonly number[]): string {
  return `${widths.map((width) => `${width}px ${HANDLE_WIDTH}px`).join(' ')} 1fr`;
}

function clamped(width: number): number {
  return Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, width));
}

import { useCallback } from 'react';
import { isNumber, isRecordOf } from '../ui/uiState/persistedUiGuards';
import { PERSISTED_UI_KEYS } from '../ui/uiState/persistedUiKeys';
import { usePersistedUiSet } from '../ui/uiState/usePersistedUiSet';
import { usePersistedUiValue } from '../ui/uiState/usePersistedUiValue';
import { panelWidthsThatLeaveRoomForWorld } from './panelWidthBudget';
import { useWindowWidth } from './useWindowWidth';

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
  resetPanelWidth(key: PanelKey): void;
  toggleCollapsed(key: PanelKey): void;
}

export function usePanelLayout(visible: readonly PanelKey[]): PanelLayout {
  const [widths, setWidths] = usePersistedUiValue<Partial<Record<PanelKey, number>>>(
    PERSISTED_UI_KEYS.panelWidths,
    START_WIDTHS,
    isRecordOf(isNumber),
  );
  const collapsed = usePersistedUiSet(PERSISTED_UI_KEYS.collapsedPanels);
  const windowWidth = useWindowWidth();

  const resizePanel = useCallback(
    (key: PanelKey, width: number) => setWidths({ ...widths, [key]: clamped(width) }),
    [widths, setWidths],
  );

  const resetPanelWidth = useCallback(
    (key: PanelKey) => setWidths({ ...widths, [key]: START_WIDTHS[key] }),
    [widths, setWidths],
  );

  const isCollapsed = (key: PanelKey) => collapsed.has(key);
  const requestedWidthOf = (key: PanelKey) =>
    isCollapsed(key) ? COLLAPSED_PANEL_WIDTH : (widths[key] ?? START_WIDTHS[key]);

  const fitted = panelWidthsThatLeaveRoomForWorld(
    visible.map(requestedWidthOf),
    HANDLE_WIDTH,
    COLLAPSED_PANEL_WIDTH,
    windowWidth,
  );
  const widthOf = (key: PanelKey) => fitted[visible.indexOf(key)] ?? requestedWidthOf(key);

  return {
    gridTemplateColumns: columnTemplate(fitted),
    widthOf,
    isCollapsed,
    resizePanel,
    resetPanelWidth,
    toggleCollapsed: (key) => collapsed.toggle(key),
  };
}

function columnTemplate(widths: readonly number[]): string {
  const panelTracks = widths.map((width) => `${width}px ${HANDLE_WIDTH}px`).join(' ');
  return `${panelTracks} minmax(0, 1fr)`;
}

function clamped(width: number): number {
  return Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, width));
}

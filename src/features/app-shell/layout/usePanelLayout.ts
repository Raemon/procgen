import { useCallback } from 'react';
import { isNumber, isRecordOf } from '@/features/app-shell/state/persistedUiGuards';
import { PERSISTED_UI_KEYS } from '@/features/app-shell/state/persistedUiKeys';
import { usePersistedUiSet } from '@/features/app-shell/state/usePersistedUiSet';
import { usePersistedUiValue } from '@/features/app-shell/state/usePersistedUiValue';
import { MIN_WORLD_WIDTH, panelWidthsThatLeaveRoomForWorld } from './panelWidthBudget';
import { useWindowWidth } from './useWindowWidth';

export type PanelKey = 'library' | 'detail' | 'agents' | 'log' | 'worlds';
export type ColumnKey = PanelKey | 'game';

const MIN_PANEL_WIDTH = 150;
const MAX_PANEL_WIDTH = 640;
const HANDLE_WIDTH = 6;
export const COLLAPSED_PANEL_WIDTH = 42;

const START_WIDTHS: Readonly<Record<PanelKey, number>> = {
  library: 240,
  detail: 300,
  agents: 250,
  log: 270,
  worlds: 520,
};

export interface PanelLayout {
  gridTemplateColumns: string;
  widthOf(key: PanelKey): number;
  isCollapsed(key: ColumnKey): boolean;
  resizePanel(key: PanelKey, width: number): void;
  resetPanelWidth(key: PanelKey): void;
  toggleCollapsed(key: ColumnKey): void;
  stretchesIntoFoldedWorldView(key: PanelKey): boolean;
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

  const isCollapsed = (key: ColumnKey) => collapsed.has(key);
  const gameIsCollapsed = isCollapsed('game');
  const requestedWidthOf = (key: PanelKey) =>
    isCollapsed(key) ? COLLAPSED_PANEL_WIDTH : (widths[key] ?? START_WIDTHS[key]);

  const fitted = panelWidthsThatLeaveRoomForWorld(
    visible.map(requestedWidthOf),
    HANDLE_WIDTH,
    COLLAPSED_PANEL_WIDTH,
    gameIsCollapsed ? COLLAPSED_PANEL_WIDTH : MIN_WORLD_WIDTH,
    windowWidth,
  );
  const widthOf = (key: PanelKey) => fitted[visible.indexOf(key)] ?? requestedWidthOf(key);
  const stretched = gameIsCollapsed ? lastExpanded(visible, isCollapsed) : NOTHING_STRETCHES;

  return {
    gridTemplateColumns: columnTemplate(fitted, stretched, gameIsCollapsed),
    widthOf,
    isCollapsed,
    resizePanel,
    resetPanelWidth,
    toggleCollapsed: (key) => collapsed.toggle(key),
    stretchesIntoFoldedWorldView: (key) => visible.indexOf(key) === stretched,
  };
}

const NOTHING_STRETCHES = -1;

function lastExpanded(
  visible: readonly PanelKey[],
  isCollapsed: (key: PanelKey) => boolean,
): number {
  return visible.reduce((last, key, index) => (isCollapsed(key) ? last : index), NOTHING_STRETCHES);
}

function gameTrack(gameIsCollapsed: boolean, stretched: number): string {
  if (!gameIsCollapsed) return 'minmax(0, 1fr)';
  if (stretched === NOTHING_STRETCHES) return `minmax(${COLLAPSED_PANEL_WIDTH}px, 1fr)`;
  return `${COLLAPSED_PANEL_WIDTH}px`;
}

function columnTemplate(
  widths: readonly number[],
  stretched: number,
  gameIsCollapsed: boolean,
): string {
  const panelTracks = widths
    .map((width, index) => `${panelTrack(width, index === stretched)} ${HANDLE_WIDTH}px`)
    .join(' ');
  return `${panelTracks} ${gameTrack(gameIsCollapsed, stretched)}`;
}

function panelTrack(width: number, stretches: boolean): string {
  return stretches ? `minmax(${width}px, 1fr)` : `${width}px`;
}

function clamped(width: number): number {
  return Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, width));
}

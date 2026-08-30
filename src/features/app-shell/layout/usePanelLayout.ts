import { useCallback } from 'react';
import { isNumber, isRecordOf } from '@/features/app-shell/state/persistedUiGuards';
import { PERSISTED_UI_KEYS } from '@/features/app-shell/state/persistedUiKeys';
import { usePersistedUiSet } from '@/features/app-shell/state/usePersistedUiSet';
import { usePersistedUiValue } from '@/features/app-shell/state/usePersistedUiValue';
import { MIN_WORLD_WIDTH, panelWidthsThatLeaveRoomForWorld } from './panelWidthBudget';
import { useWindowWidth } from './useWindowWidth';

export type PanelKey = 'library' | 'detail' | 'agents' | 'log';

export const WORLD_COLUMN = 'world';

const MIN_PANEL_WIDTH = 150;
const MAX_PANEL_WIDTH = 640;
const HANDLE_WIDTH = 6;
export const COLLAPSED_PANEL_WIDTH = 42;

const START_WIDTHS: Readonly<Record<PanelKey, number>> = {
  library: 240,
  detail: 300,
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
  stretchesIntoFoldedWorld(key: PanelKey): boolean;
  worldIsCollapsed: boolean;
  toggleWorldCollapsed(): void;
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
  const worldIsCollapsed = collapsed.has(WORLD_COLUMN);
  const requestedWidthOf = (key: PanelKey) =>
    isCollapsed(key) ? COLLAPSED_PANEL_WIDTH : (widths[key] ?? START_WIDTHS[key]);

  const fitted = panelWidthsThatLeaveRoomForWorld(
    visible.map(requestedWidthOf),
    HANDLE_WIDTH,
    COLLAPSED_PANEL_WIDTH,
    windowWidth,
    worldIsCollapsed ? COLLAPSED_PANEL_WIDTH : MIN_WORLD_WIDTH,
  );
  const widthOf = (key: PanelKey) => fitted[visible.indexOf(key)] ?? requestedWidthOf(key);
  const stretched = worldIsCollapsed ? lastOpenPanel(visible.map(isCollapsed)) : NOTHING_STRETCHES;

  return {
    gridTemplateColumns: columnTemplate(fitted, stretched, worldTrack(worldIsCollapsed, stretched)),
    widthOf,
    isCollapsed,
    resizePanel,
    resetPanelWidth,
    toggleCollapsed: (key) => collapsed.toggle(key),
    stretchesIntoFoldedWorld: (key) => visible.indexOf(key) === stretched,
    worldIsCollapsed,
    toggleWorldCollapsed: () => collapsed.toggle(WORLD_COLUMN),
  };
}

const NOTHING_STRETCHES = -1;

function lastOpenPanel(collapsedPanels: readonly boolean[]): number {
  return collapsedPanels.lastIndexOf(false);
}

function worldTrack(worldIsCollapsed: boolean, stretched: number): string {
  if (!worldIsCollapsed) return 'minmax(0, 1fr)';
  if (stretched === NOTHING_STRETCHES) return `minmax(${COLLAPSED_PANEL_WIDTH}px, 1fr)`;
  return `${COLLAPSED_PANEL_WIDTH}px`;
}

function columnTemplate(
  widths: readonly number[],
  stretched: number,
  lastTrack: string,
): string {
  const panelTracks = widths
    .map((width, index) => `${panelTrack(width, index === stretched)} ${HANDLE_WIDTH}px`)
    .join(' ');
  return `${panelTracks} ${lastTrack}`;
}

function panelTrack(width: number, stretches: boolean): string {
  return stretches ? `minmax(${width}px, 1fr)` : `${width}px`;
}

function clamped(width: number): number {
  return Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, width));
}

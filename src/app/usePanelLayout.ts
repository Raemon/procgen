import { useCallback, useState } from 'react';
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
  toggleCollapsed(key: PanelKey): void;
}

export function usePanelLayout(visible: readonly PanelKey[]): PanelLayout {
  const [widths, setWidths] = useState<Readonly<Record<PanelKey, number>>>(START_WIDTHS);
  const [collapsed, setCollapsed] = useState<ReadonlySet<PanelKey>>(new Set());
  const windowWidth = useWindowWidth();

  const resizePanel = useCallback((key: PanelKey, width: number) => {
    setWidths((current) => ({ ...current, [key]: clamped(width) }));
  }, []);
  const toggleCollapsed = useCallback((key: PanelKey) => {
    setCollapsed((current) => toggled(current, key));
  }, []);

  const isCollapsed = (key: PanelKey) => collapsed.has(key);
  const requestedWidthOf = (key: PanelKey) =>
    isCollapsed(key) ? COLLAPSED_PANEL_WIDTH : (widths[key] ?? MIN_PANEL_WIDTH);

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
    toggleCollapsed,
  };
}

function columnTemplate(widths: readonly number[]): string {
  const panelTracks = widths.map((width) => `${width}px ${HANDLE_WIDTH}px`).join(' ');
  return `${panelTracks} minmax(0, 1fr)`;
}

function clamped(width: number): number {
  return Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, width));
}

function toggled(keys: ReadonlySet<PanelKey>, key: PanelKey): ReadonlySet<PanelKey> {
  const next = new Set(keys);
  if (!next.delete(key)) next.add(key);
  return next;
}

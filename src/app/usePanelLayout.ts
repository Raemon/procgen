import { useCallback, useState } from 'react';

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

  const resizePanel = useCallback((key: PanelKey, width: number) => {
    setWidths((current) => ({ ...current, [key]: clamped(width) }));
  }, []);
  const toggleCollapsed = useCallback((key: PanelKey) => {
    setCollapsed((current) => toggled(current, key));
  }, []);

  const isCollapsed = (key: PanelKey) => collapsed.has(key);
  const widthOf = (key: PanelKey) =>
    isCollapsed(key) ? COLLAPSED_PANEL_WIDTH : (widths[key] ?? MIN_PANEL_WIDTH);

  return {
    gridTemplateColumns: columnTemplate(visible.map(widthOf)),
    widthOf,
    isCollapsed,
    resizePanel,
    toggleCollapsed,
  };
}

function columnTemplate(widths: readonly number[]): string {
  return `${widths.map((width) => `${width}px ${HANDLE_WIDTH}px`).join(' ')} 1fr`;
}

function clamped(width: number): number {
  return Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, width));
}

function toggled(keys: ReadonlySet<PanelKey>, key: PanelKey): ReadonlySet<PanelKey> {
  const next = new Set(keys);
  if (!next.delete(key)) next.add(key);
  return next;
}

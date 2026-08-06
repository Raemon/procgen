import { useCallback, useState } from 'react';

const MIN_PANEL_WIDTH = 150;
const MAX_PANEL_WIDTH = 640;
const HANDLE_WIDTH = 6;
const START_WIDTHS = [240, 280, 250, 270];

export interface PanelWidths {
  widths: readonly number[];
  gridTemplateColumns: string;
  resizePanel(index: number, width: number): void;
}

export function usePanelWidths(): PanelWidths {
  const [widths, setWidths] = useState<readonly number[]>(START_WIDTHS);
  const resizePanel = useCallback((index: number, width: number) => {
    setWidths((current) => current.map((old, at) => (at === index ? clamped(width) : old)));
  }, []);
  return { widths, gridTemplateColumns: columnTemplate(widths), resizePanel };
}

function columnTemplate(widths: readonly number[]): string {
  return `${widths.map((width) => `${width}px ${HANDLE_WIDTH}px`).join(' ')} 1fr`;
}

function clamped(width: number): number {
  return Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, width));
}

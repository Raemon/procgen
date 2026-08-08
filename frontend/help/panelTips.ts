import type { TooltipContent } from '../tooltips/tooltipContent';
import type { PanelKey } from '../usePanelLayout';

export const PANEL_TIPS: Readonly<Record<PanelKey, TooltipContent>> = {
  assets: {
    title: 'assets',
    body: 'Every asset a world is built from: tiles, items, piece stamps, creatures and characters. Procgen nodes reference assets by name, so an edit here shows up everywhere the asset is used.',
  },
  procgen: {
    title: 'procgen',
    body: 'The pipeline that generates the world. Nodes run top to bottom; each one turns the values above it into new values, and its display setting decides what reaches the map.',
  },
  agents: {
    title: 'agents',
    body: 'LLM players that live on the dev server and drive the world through the same HTTP API an outside client would use.',
  },
  log: {
    title: 'agent log',
    body: 'The transcript of the selected agent: what it saw, what it decided, and what it spent.',
  },
};

export const RESIZER_TIP: TooltipContent = {
  title: 'resize',
  body: 'Drag to give the column more or less room. Double-click to put it back to its starting width.',
};

export function collapsePanelTip(title: string): TooltipContent {
  return {
    title: `collapse ${title}`,
    body: 'Folds the column down to a rail and gives its width back to the world view. Click the rail to bring it back.',
  };
}

export function expandPanelTip(title: string): TooltipContent {
  return { title: `expand ${title}`, body: 'Reopens the column at the width you left it.' };
}

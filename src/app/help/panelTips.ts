import type { TooltipContent } from '../../ui/tooltips/tooltipContent';
import type { PanelKey } from '../usePanelLayout';

export const PANEL_TIPS: Readonly<Record<PanelKey, TooltipContent>> = {
  library: {
    title: 'library',
    body: 'The raw material every world is built from: tiles, prefab stamps and creatures. Procgen nodes reference these by name, so an edit here shows up everywhere the entry is used.',
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

export function collapsePanelTip(title: string): TooltipContent {
  return {
    title: `collapse ${title}`,
    body: 'Folds the column down to a rail and gives its width back to the world view. Click the rail to bring it back.',
  };
}

export function expandPanelTip(title: string): TooltipContent {
  return { title: `expand ${title}`, body: 'Reopens the column at the width you left it.' };
}

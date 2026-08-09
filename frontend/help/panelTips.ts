import type { TooltipContent } from '../tooltips/tooltipContent';
import type { PanelKey } from '../usePanelLayout';

export const PANEL_TIPS: Readonly<Record<PanelKey, TooltipContent>> = {
  library: {
    title: 'asset library',
    body: 'Folders of every kind of asset a world is made of — worlds themselves, tiles, items, piece stamps, cultures, creatures, characters, and the bookmarked node groups. Pick anything to open it in the detail column.',
  },
  detail: {
    title: 'detail',
    body: 'Whatever is selected in the asset library, opened for editing: a world and the nodes generating it, a tile to paint, a piece to carve, a node group to stamp.',
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

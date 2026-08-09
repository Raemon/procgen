import type { NodeInstance } from '../../pipeline/pipelineState';
import type { TooltipContent } from '../../../frontend/tooltips/tooltipContent';

export const DRAG_HANDLE_TIP: TooltipContent = {
  title: 'drag to reorder',
  body: 'Nodes run top to bottom, so order decides what can feed what and which tile layer covers which.',
};

export const NODE_LABEL_TIP: TooltipContent = {
  title: 'node label',
  body: 'The name this node answers to in every input dropdown. Naming what a node is for beats leaving it as noise-1.',
};

export const NODE_NOTES_TIP: TooltipContent = {
  title: 'notes',
  body: 'A free-text note kept with the node and saved into presets and templates. Nothing reads it but you.',
};

export const NODE_FOLDER_TIP: TooltipContent = {
  title: 'folder',
  body: 'Library-only grouping. Adjacent nodes sharing a folder name fold into one band that can be collapsed or bookmarked as a node group; nothing about generation changes.',
};

export const FOLDER_NAME_TIP: TooltipContent = {
  title: 'folder name',
  body: 'Renaming retags every node in the band. Grouping is for the library only and never changes what is generated.',
};

export const SAVE_TEMPLATE_TIP: TooltipContent = {
  title: 'bookmark as a node group',
  body: 'Files this band in the node groups folder for reuse: wiring inside the folder is preserved, wiring to nodes outside it is left open for the next stamp to fill.',
};

export const UNGROUP_TIP: TooltipContent = {
  title: 'ungroup',
  body: 'Clears the folder name from every node in the band. Each node stays exactly where it is.',
};

export function nodeEnabledTip(node: NodeInstance): TooltipContent {
  return {
    title: node.enabled ? 'enabled' : 'disabled',
    body: 'A disabled node is skipped when the pipeline runs, and anything wired to it sees nothing — the cheapest way to ask what a node was contributing.',
  };
}

export function nodeTypeTip(node: NodeInstance, typeTitle: string): TooltipContent {
  return {
    title: `${node.label} · ${typeTitle}`,
    body: 'What kind of node this is. The type is fixed once added — delete and add another to change it.',
  };
}

export function duplicateNodeTip(node: NodeInstance): TooltipContent {
  return {
    title: `duplicate ${node.label}`,
    body: 'Drops a copy in after this one, knobs and wiring included.',
  };
}

export function deleteNodeTip(node: NodeInstance): TooltipContent {
  return {
    title: `delete ${node.label}`,
    body: 'Removes the node. Anything wired to it is left unwired and will flag as missing.',
  };
}

export function collapseFolderTip(collapsed: boolean): TooltipContent {
  return {
    title: collapsed ? 'expand folder' : 'collapse folder',
    body: 'Folds the band down to a one-line summary of the nodes inside it.',
  };
}

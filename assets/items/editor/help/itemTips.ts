import { renderLabel, type ItemDef } from '../../itemDef';
import type { TooltipContent } from '../../../../frontend/tooltips/tooltipContent';

export const ITEM_ART_TIP: TooltipContent = {
  title: 'item art',
  body: 'Opens the pixel editor — a sprite for billboard items, six cube faces for the rest.',
};

export const ITEM_COLOR_TIP: TooltipContent = {
  title: 'item colour',
  body: 'The ASCII ink for this item, and the fill used anywhere it has no art yet.',
};

export const ITEM_NAME_TIP: TooltipContent = {
  title: 'item name',
  body: 'How the item is listed when placing it into an inventory.',
};

export const ITEM_EDGE_COLOR_TIP: TooltipContent = {
  title: 'edge colour',
  body: 'The colour of the extruded rim on a billboard that has no sprite. A sprite extrudes its own outline instead, each wall shaded from the pixel it was cut from.',
};

export const ITEM_TAGS_TIP: TooltipContent = {
  title: 'item tags',
  body: 'Comma-separated labels. A tagged slot only accepts items that carry one of its tags; untagged slots take anything.',
};

export const ITEM_GRID_TIPS = {
  columns: { title: 'inventory columns', body: 'How many slots wide the item sits in a bag.' },
  rows: { title: 'inventory rows', body: 'How many slots tall the item sits in a bag.' },
} as const satisfies Record<string, TooltipContent>;

export function itemShapeTip(item: ItemDef): TooltipContent {
  return {
    title: `${renderLabel(item.render)} · ${item.gridWidth}×${item.gridHeight}`,
    body: 'Opens how the item is drawn in the world and how much room it takes in a bag.',
  };
}

export function duplicateItemTip(item: ItemDef): TooltipContent {
  return { title: `duplicate ${item.name}`, body: 'Copies the item, art and tags included.' };
}

export function deleteItemTip(item: ItemDef): TooltipContent {
  return {
    title: `delete ${item.name}`,
    body: 'Removes the item. Inventories holding one lose it.',
  };
}

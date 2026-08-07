import type { TooltipContent } from '../../tooltips/tooltipContent';

export const REMOVE_INVENTORY_TIP: TooltipContent = {
  title: 'remove the bag',
  body: 'Drops the inventory grid and everything in it, leaving a plain creature behind.',
};

export const SLOT_TAGS_TIP: TooltipContent = {
  title: 'slot tags',
  body: 'Only items carrying one of these tags may sit in this slot. Leave it empty and the slot accepts anything.',
};

export const GRID_SIDE_TIPS = {
  columns: { title: 'columns', body: 'How many slots wide the bag is. Shrinking drops what falls outside.' },
  rows: { title: 'rows', body: 'How many slots tall the bag is. Shrinking drops what falls outside.' },
} as const satisfies Record<string, TooltipContent>;

export function inventoryModeTip(label: string, help: string): TooltipContent {
  return { title: label, body: help };
}

export function slotTip(x: number, y: number, usable: boolean, tags: readonly string[]): TooltipContent {
  return {
    title: `slot ${x},${y}`,
    body: usable
      ? tagRestriction(tags)
      : 'Switched off — nothing can be placed here, so the bag need not be a plain rectangle.',
  };
}

export function placedItemTip(name: string, width: number, height: number): TooltipContent {
  return { title: name, body: `Takes ${width}×${height} slots. Click to take it back out.` };
}

function tagRestriction(tags: readonly string[]): string {
  return tags.length === 0
    ? 'Accepts any item that fits.'
    : `Accepts only items tagged ${tags.join(', ')}.`;
}

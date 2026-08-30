export const ITEM_PANELS = ['none', 'art'] as const;

export type ItemPanel = (typeof ITEM_PANELS)[number];

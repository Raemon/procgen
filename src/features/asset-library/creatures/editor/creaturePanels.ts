export const CREATURE_PANELS = ['none', 'art', 'inventory', 'sprites'] as const;

export type CreaturePanel = (typeof CREATURE_PANELS)[number];

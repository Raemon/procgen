export const CREATURE_PANELS = ['none', 'behavior', 'art', 'inventory', 'sprites'] as const;

export type CreaturePanel = (typeof CREATURE_PANELS)[number];

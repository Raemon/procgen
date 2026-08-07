export type InventoryEditorMode = 'slots' | 'tags' | 'items';

export const INVENTORY_MODES: { mode: InventoryEditorMode; label: string; help: string }[] = [
  {
    mode: 'slots',
    label: 'slots',
    help: 'Click a cell to switch it between usable and dead.',
  },
  {
    mode: 'tags',
    label: 'tags',
    help: 'Click a cell to select it, then edit the tags it accepts below.',
  },
  {
    mode: 'items',
    label: 'items',
    help: 'Pick an item, then click where its top-left corner goes. Click a placed item to take it out.',
  },
];

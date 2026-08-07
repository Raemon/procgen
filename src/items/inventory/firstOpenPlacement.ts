import type { ItemDef } from '../itemDef';
import type { ItemSource } from '../itemLibrary';
import type { InventoryDef } from './inventoryDef';
import { canPlaceItemAt } from './inventoryPlacement';

export function firstOpenPlacement(
  inventory: InventoryDef,
  items: ItemSource,
  item: ItemDef,
): { x: number; y: number } | null {
  for (let y = 0; y < inventory.height; y++) {
    for (let x = 0; x < inventory.width; x++) {
      if (canPlaceItemAt(inventory, items, item, x, y)) return { x, y };
    }
  }
  return null;
}

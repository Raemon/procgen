import type { InventoryDef } from '../inventory/inventoryDef';
import type { ItemDef } from '../itemDef';

export function footprintRect(
  inventory: InventoryDef,
  item: ItemDef,
  cell: { x: number; y: number },
) {
  return {
    left: `${(cell.x / inventory.width) * 100}%`,
    top: `${(cell.y / inventory.height) * 100}%`,
    width: `${(item.gridWidth / inventory.width) * 100}%`,
    height: `${(item.gridHeight / inventory.height) * 100}%`,
  };
}

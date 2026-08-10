import type { ItemDef } from '../itemDef';
import type { ItemSource } from '../itemAssets';
import {
  isInsideInventory,
  slotAt,
  type InventoryDef,
  type InventoryPlacement,
} from './inventoryDef';

export type PlacementRefusal = 'off_grid' | 'slot_unusable' | 'tag_mismatch' | 'slot_taken';

export const REFUSAL_HINTS: Readonly<Record<PlacementRefusal, string>> = {
  off_grid: 'the item would hang off the edge of the grid',
  slot_unusable: 'one of the cells it would cover is marked unusable',
  tag_mismatch: 'one of the cells it would cover only accepts other tags',
  slot_taken: 'another item already covers one of those cells',
};

export function footprintCells(item: ItemDef, x: number, y: number): { x: number; y: number }[] {
  const cells: { x: number; y: number }[] = [];
  for (let row = 0; row < item.gridHeight; row++) {
    for (let column = 0; column < item.gridWidth; column++) {
      cells.push({ x: x + column, y: y + row });
    }
  }
  return cells;
}

export function slotAcceptsTags(slotTags: readonly string[], itemTags: readonly string[]): boolean {
  return slotTags.length === 0 || slotTags.some((tag) => itemTags.includes(tag));
}

export function placementRefusal(
  inventory: InventoryDef,
  items: ItemSource,
  item: ItemDef,
  x: number,
  y: number,
): PlacementRefusal | null {
  for (const cell of footprintCells(item, x, y)) {
    const slot = slotAt(inventory, cell.x, cell.y);
    if (!slot) return 'off_grid';
    if (!slot.usable) return 'slot_unusable';
    if (!slotAcceptsTags(slot.tags, item.tags)) return 'tag_mismatch';
  }
  return coversAnyPlacement(inventory, items, item, x, y) ? 'slot_taken' : null;
}

export function canPlaceItemAt(
  inventory: InventoryDef,
  items: ItemSource,
  item: ItemDef,
  x: number,
  y: number,
): boolean {
  return placementRefusal(inventory, items, item, x, y) === null;
}

export function withItemPlaced(
  inventory: InventoryDef,
  item: ItemDef,
  x: number,
  y: number,
): InventoryDef {
  return { ...inventory, placements: [...inventory.placements, { itemId: item.id, x, y }] };
}

export function placementCovering(
  inventory: InventoryDef,
  items: ItemSource,
  x: number,
  y: number,
): InventoryPlacement | null {
  return (
    inventory.placements.find((placement) => placementCovers(placement, items, x, y)) ?? null
  );
}

export function withoutPlacementCovering(
  inventory: InventoryDef,
  items: ItemSource,
  x: number,
  y: number,
): InventoryDef {
  const covering = placementCovering(inventory, items, x, y);
  if (!covering) return inventory;
  return {
    ...inventory,
    placements: inventory.placements.filter((placement) => placement !== covering),
  };
}

export function prunedPlacements(inventory: InventoryDef, items: ItemSource): InventoryDef {
  const kept: InventoryPlacement[] = [];
  let pruned: InventoryDef = { ...inventory, placements: [] };
  for (const placement of inventory.placements) {
    const item = items.byId(placement.itemId);
    if (!item || !canPlaceItemAt(pruned, items, item, placement.x, placement.y)) continue;
    kept.push(placement);
    pruned = { ...pruned, placements: kept };
  }
  return pruned;
}

function placementCovers(
  placement: InventoryPlacement,
  items: ItemSource,
  x: number,
  y: number,
): boolean {
  const item = items.byId(placement.itemId);
  if (!item) return false;
  return footprintCells(item, placement.x, placement.y).some(
    (cell) => cell.x === x && cell.y === y,
  );
}

function coversAnyPlacement(
  inventory: InventoryDef,
  items: ItemSource,
  item: ItemDef,
  x: number,
  y: number,
): boolean {
  return footprintCells(item, x, y).some(
    (cell) =>
      isInsideInventory(inventory, cell.x, cell.y) &&
      placementCovering(inventory, items, cell.x, cell.y) !== null,
  );
}

import { isSpriteArt } from '../../tiles/spriteArt';
import { normalizedTags } from '../itemDef';
import {
  blankInventory,
  clampSide,
  openSlot,
  slotIndex,
  type InventoryDef,
  type InventoryPlacement,
  type InventorySlot,
} from './inventoryDef';

export function sanitizeInventory(raw: unknown): InventoryDef | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const stored = raw as Partial<InventoryDef>;
  if (typeof stored.width !== 'number' || typeof stored.height !== 'number') return null;
  const inventory = blankInventory(clampSide(stored.width), clampSide(stored.height));
  applyStoredSlots(inventory, stored.slots);
  inventory.placements = storedPlacements(inventory, stored.placements);
  inventory.background = isSpriteArt(stored.background) ? stored.background : null;
  return inventory;
}

function applyStoredSlots(inventory: InventoryDef, stored: unknown): void {
  if (!Array.isArray(stored)) return;
  for (let y = 0; y < inventory.height; y++) {
    for (let x = 0; x < inventory.width; x++) {
      const index = slotIndex(inventory, x, y);
      inventory.slots[index] = sanitizeSlot(stored[index]);
    }
  }
}

function sanitizeSlot(raw: unknown): InventorySlot {
  if (typeof raw !== 'object' || raw === null) return openSlot();
  const slot = raw as Partial<InventorySlot>;
  return {
    usable: slot.usable !== false,
    tags: normalizedTags(Array.isArray(slot.tags) ? slot.tags.filter(isString) : []),
  };
}

function storedPlacements(inventory: InventoryDef, raw: unknown): InventoryPlacement[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isPlacement).filter((placement) => isAnchoredInside(inventory, placement));
}

function isPlacement(value: unknown): value is InventoryPlacement {
  if (typeof value !== 'object' || value === null) return false;
  const placement = value as Partial<InventoryPlacement>;
  return (
    Number.isInteger(placement.itemId) &&
    Number.isInteger(placement.x) &&
    Number.isInteger(placement.y)
  );
}

function isAnchoredInside(inventory: InventoryDef, placement: InventoryPlacement): boolean {
  return (
    placement.x >= 0 &&
    placement.y >= 0 &&
    placement.x < inventory.width &&
    placement.y < inventory.height
  );
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

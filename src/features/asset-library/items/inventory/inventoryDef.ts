import type { ItemId } from '@/features/asset-library/asset';
import type { SpriteArt } from '../../tiles/spriteArt';
import { normalizedTags } from '../itemDef';

export const MAX_INVENTORY_SIDE = 16;
export const DEFAULT_INVENTORY_WIDTH = 6;
export const DEFAULT_INVENTORY_HEIGHT = 4;

export interface InventorySlot {
  usable: boolean;
  tags: string[];
}

export interface InventoryPlacement {
  itemId: ItemId;
  x: number;
  y: number;
}

export interface InventoryDef {
  width: number;
  height: number;
  slots: InventorySlot[];
  placements: InventoryPlacement[];
  background: SpriteArt | null;
}

export function openSlot(): InventorySlot {
  return { usable: true, tags: [] };
}

export function blankInventory(
  width: number = DEFAULT_INVENTORY_WIDTH,
  height: number = DEFAULT_INVENTORY_HEIGHT,
): InventoryDef {
  const side = { width: clampSide(width), height: clampSide(height) };
  return {
    ...side,
    slots: Array.from({ length: side.width * side.height }, openSlot),
    placements: [],
    background: null,
  };
}

export function clampSide(side: number): number {
  return Math.max(1, Math.min(MAX_INVENTORY_SIDE, Math.round(side)));
}

export function isInsideInventory(inventory: InventoryDef, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < inventory.width && y < inventory.height;
}

export function slotIndex(inventory: InventoryDef, x: number, y: number): number {
  return y * inventory.width + x;
}

export function slotAt(inventory: InventoryDef, x: number, y: number): InventorySlot | null {
  return isInsideInventory(inventory, x, y) ? inventory.slots[slotIndex(inventory, x, y)]! : null;
}

export function withSlotAt(
  inventory: InventoryDef,
  x: number,
  y: number,
  patch: Partial<InventorySlot>,
): InventoryDef {
  if (!isInsideInventory(inventory, x, y)) return inventory;
  const index = slotIndex(inventory, x, y);
  const slots = inventory.slots.map((slot, at) =>
    at === index ? { ...slot, ...patch, tags: normalizedTags(patch.tags ?? slot.tags) } : slot,
  );
  return { ...inventory, slots };
}

export function resizedInventory(
  inventory: InventoryDef,
  width: number,
  height: number,
): InventoryDef {
  const resized = blankInventory(width, height);
  for (let y = 0; y < resized.height; y++) {
    for (let x = 0; x < resized.width; x++) {
      const kept = slotAt(inventory, x, y);
      if (kept) resized.slots[slotIndex(resized, x, y)] = { ...kept, tags: [...kept.tags] };
    }
  }
  resized.background = inventory.background;
  resized.placements = inventory.placements.filter((placement) =>
    isInsideInventory(resized, placement.x, placement.y),
  );
  return resized;
}


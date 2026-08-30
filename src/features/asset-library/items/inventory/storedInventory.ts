import { storedSpriteOf, type StoredSpriteArt } from '../../tiles/storage/storedSpriteArt';
import type { InventoryDef } from './inventoryDef';

export type StoredInventory = Omit<InventoryDef, 'background'> & {
  background: StoredSpriteArt | null;
};

export function inventoryAsStoredJson(inventory: InventoryDef): StoredInventory {
  return {
    ...inventory,
    background: inventory.background && storedSpriteOf(inventory.background),
  };
}

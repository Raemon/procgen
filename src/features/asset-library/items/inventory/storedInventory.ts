import { compactSpriteArtOf, type CompactSpriteArt } from '../../tiles/storage/storedSpriteArt';
import type { InventoryDef } from './inventoryDef';

export type StoredInventory = Omit<InventoryDef, 'background'> & {
  background: CompactSpriteArt | null;
};

export function inventoryAsStoredJson(inventory: InventoryDef): StoredInventory {
  return {
    ...inventory,
    background: inventory.background && compactSpriteArtOf(inventory.background),
  };
}

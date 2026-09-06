import { playerCharacterDef } from '@/features/asset-library/characters/playerCharacter';
import type { CreatureAssets } from '@/features/asset-library/creatures/creatureAssets';
import type { InventoryDef, InventoryPlacement } from '@/features/asset-library/items/inventory/inventoryDef';
import { withoutPlacementCovering } from '@/features/asset-library/items/inventory/inventoryPlacement';
import type { ItemSource } from '@/features/asset-library/items/itemAssets';
import type { KeyPurse } from './keyPurse';

export const KEY_TAG = 'key';

export function carriedKeysOf(creatures: CreatureAssets, items: ItemSource): KeyPurse {
  return {
    spendKey: () => {
      const carrier = playerCharacterDef(creatures);
      const inventory = carrier?.inventory;
      if (!carrier || !inventory) return false;
      const held = keyPlacementIn(inventory, items);
      if (!held) return false;
      creatures.update(carrier.id, {
        inventory: withoutPlacementCovering(inventory, items, held.x, held.y),
      });
      return true;
    },
  };
}

function keyPlacementIn(inventory: InventoryDef, items: ItemSource): InventoryPlacement | null {
  return (
    inventory.placements.find((placement) =>
      items.byId(placement.itemId)?.tags.includes(KEY_TAG),
    ) ?? null
  );
}

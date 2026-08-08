import { AssetCollection } from '../collection/assetCollection';
import { defaultItems } from './defaultItems';
import { newItemWithId, type ItemDef } from './itemDef';
import { loadStoredItems, storeItems } from './itemStorage';

export type ItemPatch = Partial<Omit<ItemDef, 'id'>>;

export interface ItemSource {
  byId(id: number): ItemDef | undefined;
}

export class ItemAssets extends AssetCollection<ItemDef> implements ItemSource {
  constructor(initialItems?: ItemDef[]) {
    super(initialItems ?? loadStoredItems() ?? defaultItems());
  }

  protected blankAsset(id: number): ItemDef {
    return newItemWithId(id);
  }

  protected store(items: readonly ItemDef[]): void {
    storeItems(items);
  }
}

export const NO_ITEMS: ItemSource = { byId: () => undefined };

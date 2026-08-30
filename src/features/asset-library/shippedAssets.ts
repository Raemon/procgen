import { creaturesAsStoredJson } from './creatures/creatureStorage';
import { defaultCreatures } from './creatures/defaultCreatures';
import { defaultCultures } from './cultures/defaultCultures';
import { defaultItems } from './items/defaultItems';
import { itemsAsStoredJson } from './items/itemStorage';
import { defaultPieces } from './pieces/defaultPieces';
import { defaultTiles } from './tiles/defaultTiles';
import { tilesAsStoredJson } from './tiles/tileStorage';

export const SHIPPED_COLLECTION_NAMES = ['tiles', 'pieces', 'cultures', 'creatures', 'items'] as const;

export type ShippedCollectionName = (typeof SHIPPED_COLLECTION_NAMES)[number];

interface IdentifiedAsset {
  id: number;
}

export interface ShippedAssetsAdded {
  stored: IdentifiedAsset[];
  added: number;
}

const CATALOGS: Readonly<Record<ShippedCollectionName, () => IdentifiedAsset[]>> = {
  tiles: () => tilesAsStoredJson(defaultTiles()),
  pieces: () => defaultPieces(),
  cultures: () => defaultCultures(),
  creatures: () => creaturesAsStoredJson(defaultCreatures()),
  items: () => itemsAsStoredJson(defaultItems()),
};

export function shippedAssets(name: ShippedCollectionName): IdentifiedAsset[] {
  return CATALOGS[name]();
}

export function withMissingShippedAssets(
  name: ShippedCollectionName,
  held: unknown,
): ShippedAssetsAdded {
  const kept = Array.isArray(held) ? (held as IdentifiedAsset[]) : [];
  const have = new Set(kept.map((asset) => asset.id));
  const missing = shippedAssets(name).filter((asset) => !have.has(asset.id));
  return { stored: [...kept, ...missing], added: missing.length };
}

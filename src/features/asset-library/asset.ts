import type { CreatureDef } from './creatures/creatureDef';
import type { Culture } from './cultures/cultureDef';
import type { ItemDef } from './items/itemDef';
import type { Piece } from './pieces/pieceDef';
import type { TileDef } from './tiles/tileDef';

export type AssetName = string;

export const ASSET_KINDS = ['tiles', 'items', 'pieces', 'cultures', 'creatures', 'characters'] as const;

export type AssetKind = (typeof ASSET_KINDS)[number];

export interface AssetsByKind {
  tiles: TileDef;
  items: ItemDef;
  pieces: Piece;
  cultures: Culture;
  creatures: CreatureDef;
  characters: CreatureDef;
}

export type AssetOfKind<Kind extends AssetKind> = AssetsByKind[Kind];

declare const assetKindBrand: unique symbol;

export type AssetIdOf<Kind extends AssetKind> = number & { readonly [assetKindBrand]: Kind };

export type TileId = AssetIdOf<'tiles'>;
export type ItemId = AssetIdOf<'items'>;
export type PieceId = AssetIdOf<'pieces'>;
export type CultureId = AssetIdOf<'cultures'>;
export type CreatureId = AssetIdOf<'creatures'>;

export type AssetId = AssetIdOf<AssetKind>;

export interface Asset {
  id: AssetId;
  name: AssetName;
}

export function assetId<Kind extends AssetKind>(id: number): AssetIdOf<Kind> {
  return id as AssetIdOf<Kind>;
}

export const NO_TILE = -1 as TileId;
export const NO_PIECE = -1 as PieceId;
export const NO_CREATURE = -1 as CreatureId;
export const NO_ITEM = -1 as ItemId;
export const NO_CULTURE = -1 as CultureId;

export function roundedAssetId<Kind extends AssetKind>(
  value: number,
  fallback: AssetIdOf<Kind>,
): AssetIdOf<Kind> {
  return Number.isFinite(value) ? (Math.round(value) as AssetIdOf<Kind>) : fallback;
}

export type AssetIdMap<Kind extends AssetKind> = Map<AssetIdOf<Kind>, AssetIdOf<Kind>>;

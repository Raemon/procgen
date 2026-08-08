export interface Asset {
  id: number;
  name: string;
}

export const ASSET_KINDS = ['tiles', 'items', 'pieces', 'cultures', 'creatures', 'characters'] as const;

export type AssetKind = (typeof ASSET_KINDS)[number];

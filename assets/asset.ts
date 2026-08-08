export interface Asset {
  id: number;
  name: string;
}

export const ASSET_KINDS = ['tiles', 'items', 'prefabs', 'creatures', 'characters'] as const;

export type AssetKind = (typeof ASSET_KINDS)[number];

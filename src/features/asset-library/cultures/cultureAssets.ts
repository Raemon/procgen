import type { AssetOfKind } from '@/features/asset-library/asset';
import type { CultureId } from '@/features/asset-library/asset';
import { AssetCollection } from '../collection/assetCollection';
import { defaultCultures } from './defaultCultures';
import { newCultureWithId, type Culture } from './cultureDef';
import { loadStoredCultures, storeCultures } from './cultureStorage';

export type CulturePatch = Partial<Omit<Culture, 'id'>>;

export class CultureAssets extends AssetCollection<AssetOfKind<'cultures'>> {
  constructor(initialCultures?: Culture[]) {
    super(initialCultures ?? loadStoredCultures() ?? defaultCultures());
  }

  protected blankAsset(id: CultureId): Culture {
    return newCultureWithId(id);
  }

  protected store(cultures: readonly Culture[]): void {
    storeCultures(cultures);
  }
}

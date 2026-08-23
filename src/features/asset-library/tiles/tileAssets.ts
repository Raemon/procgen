import type { AssetOfKind } from '@/features/asset-library/asset';
import type { TileId } from '@/features/asset-library/asset';
import { AssetCollection, type AssetPatch } from '../collection/assetCollection';
import { newTileWithId, tileSealedWhenBlocking, type TileDef, type TileRole } from './tileDef';
import { loadStoredTiles, storeTiles } from './tileStorage';

export type EditableTileFields = Partial<Omit<TileDef, 'id' | 'role'>>;

export class TileAssets extends AssetCollection<AssetOfKind<'tiles'>> {
  constructor(initialTiles?: TileDef[]) {
    super(initialTiles ?? loadStoredTiles() ?? []);
  }

  update(id: TileId, patch: AssetPatch<TileDef>): void {
    const current = this.byId(id);
    if (!current) return;
    const sealed = tileSealedWhenBlocking({ ...current, ...patch });
    super.update(id, { ...patch, shape: sealed.shape, height: sealed.height });
  }

  byRole(role: TileRole): TileDef | undefined {
    return this.all().find((tile) => tile.role === role);
  }

  idForRole(role: TileRole): number {
    return this.byRole(role)?.id ?? -1;
  }

  protected append(tile: TileDef): TileDef {
    return super.append(tileSealedWhenBlocking(tile));
  }

  protected blankAsset(id: TileId): TileDef {
    return newTileWithId(id);
  }

  protected store(tiles: readonly TileDef[]): void {
    storeTiles(tiles);
  }
}

import { AssetCollection } from '../collection/assetCollection';
import { defaultTiles } from './defaultTiles';
import { newTileWithId, type TileDef, type TileRole } from './tileDef';
import { loadStoredTiles, storeTiles } from './tileStorage';

export type EditableTileFields = Partial<Omit<TileDef, 'id' | 'role'>>;

export class TileAssets extends AssetCollection<TileDef> {
  constructor(initialTiles?: TileDef[]) {
    super(initialTiles ?? loadStoredTiles() ?? defaultTiles());
  }

  byRole(role: TileRole): TileDef | undefined {
    return this.all().find((tile) => tile.role === role);
  }

  idForRole(role: TileRole): number {
    return this.byRole(role)?.id ?? -1;
  }

  protected blankAsset(id: number): TileDef {
    return newTileWithId(id);
  }

  protected store(tiles: readonly TileDef[]): void {
    storeTiles(tiles);
  }
}

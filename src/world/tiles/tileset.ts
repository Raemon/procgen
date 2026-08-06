import { defaultTiles, newTileWithId, type TileDef, type TileRole } from './tileDef';
import { loadStoredTiles, storeTiles } from './tilesetStorage';

export type EditableTileFields = Partial<Omit<TileDef, 'id' | 'role'>>;

export class Tileset {
  private tiles: TileDef[] = loadStoredTiles() ?? defaultTiles();
  private nextId = this.tiles.reduce((highest, tile) => Math.max(highest, tile.id + 1), 0);
  private readonly listeners = new Set<() => void>();

  all(): readonly TileDef[] {
    return this.tiles;
  }

  byId(id: number): TileDef | undefined {
    return this.tiles.find((tile) => tile.id === id);
  }

  byRole(role: TileRole): TileDef | undefined {
    return this.tiles.find((tile) => tile.role === role);
  }

  idForRole(role: TileRole): number {
    return this.byRole(role)?.id ?? -1;
  }

  add(): TileDef {
    const tile = newTileWithId(this.nextId++);
    this.tiles.push(tile);
    this.persistAndNotify();
    return tile;
  }

  remove(id: number): void {
    this.tiles = this.tiles.filter((tile) => tile.id !== id);
    this.persistAndNotify();
  }

  update(id: number, patch: EditableTileFields): void {
    const tile = this.byId(id);
    if (!tile) return;
    Object.assign(tile, patch);
    this.persistAndNotify();
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private persistAndNotify(): void {
    storeTiles(this.tiles);
    for (const listener of this.listeners) listener();
  }
}

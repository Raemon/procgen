import type { Asset } from '../asset';

export type AssetPatch<T extends Asset> = Partial<Omit<T, 'id'>>;

export type IdOf<T extends Asset> = T['id'];

export abstract class AssetCollection<T extends Asset> {
  private assets: T[];
  private nextId: IdOf<T>;
  private readonly listeners = new Set<() => void>();

  protected constructor(assets: T[]) {
    this.assets = assets;
    this.nextId = assets.reduce<number>((highest, asset) => Math.max(highest, asset.id + 1), 0) as IdOf<T>;
  }

  all(): readonly T[] {
    return this.assets;
  }

  byId(id: IdOf<T>): T | undefined {
    return this.assets.find((asset) => asset.id === id);
  }

  add(): T {
    return this.append(this.blankAsset(this.claimId()));
  }

  insert(asset: Omit<T, 'id'> & { id?: IdOf<T> }): T {
    return this.append({ ...asset, id: this.claimId() } as T);
  }

  duplicate(id: IdOf<T>): T | null {
    const original = this.byId(id);
    if (!original) return null;
    return this.append(this.copyOf(original));
  }

  remove(id: IdOf<T>): void {
    this.assets = this.assets.filter((asset) => asset.id !== id);
    this.persistAndNotify();
  }

  update(id: IdOf<T>, patch: AssetPatch<T>): void {
    const asset = this.byId(id);
    if (!asset) return;
    Object.assign(asset, patch);
    this.persistAndNotify();
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  protected claimId(): IdOf<T> {
    return this.nextId++ as IdOf<T>;
  }

  protected copyOf(original: T): T {
    return { ...structuredClone(original), id: this.claimId(), name: `${original.name} copy` };
  }

  protected append(asset: T): T {
    this.assets.push(asset);
    this.persistAndNotify();
    return asset;
  }

  protected persistAndNotify(): void {
    this.store(this.assets);
    for (const listener of this.listeners) listener();
  }

  protected abstract blankAsset(id: IdOf<T>): T;

  protected abstract store(assets: readonly T[]): void;
}

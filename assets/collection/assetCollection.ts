import type { Asset } from '../asset';

export type AssetPatch<T extends Asset> = Partial<Omit<T, 'id'>>;

export abstract class AssetCollection<T extends Asset> {
  private assets: T[];
  private nextId: number;
  private readonly listeners = new Set<() => void>();

  protected constructor(assets: T[]) {
    this.assets = assets;
    this.nextId = assets.reduce((highest, asset) => Math.max(highest, asset.id + 1), 0);
  }

  all(): readonly T[] {
    return this.assets;
  }

  byId(id: number): T | undefined {
    return this.assets.find((asset) => asset.id === id);
  }

  add(): T {
    return this.append(this.blankAsset(this.claimId()));
  }

  duplicate(id: number): T | null {
    const original = this.byId(id);
    if (!original) return null;
    return this.append(this.copyOf(original));
  }

  remove(id: number): void {
    this.assets = this.assets.filter((asset) => asset.id !== id);
    this.persistAndNotify();
  }

  update(id: number, patch: AssetPatch<T>): void {
    const asset = this.byId(id);
    if (!asset) return;
    Object.assign(asset, patch);
    this.persistAndNotify();
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  protected claimId(): number {
    return this.nextId++;
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

  protected abstract blankAsset(id: number): T;

  protected abstract store(assets: readonly T[]): void;
}

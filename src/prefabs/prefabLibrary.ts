import { defaultPrefabs, type TileIdByName } from './defaultPrefabs';
import { newPrefabWithId, prefabFootprintRadius, type Prefab } from './prefabDef';
import { loadStoredPrefabs, storePrefabs } from './prefabStorage';

export type PrefabPatch = Partial<Omit<Prefab, 'id'>>;
export type PrefabAddedListener = (prefab: Prefab) => void;

export class PrefabLibrary {
  private prefabs: Prefab[];
  private nextId: number;
  private readonly listeners = new Set<() => void>();
  private readonly addedListeners = new Set<PrefabAddedListener>();

  constructor(tileIdOf: TileIdByName, initialPrefabs?: Prefab[]) {
    this.prefabs = initialPrefabs ?? loadStoredPrefabs() ?? defaultPrefabs(tileIdOf);
    this.nextId = this.prefabs.reduce((highest, prefab) => Math.max(highest, prefab.id + 1), 0);
  }

  all(): readonly Prefab[] {
    return this.prefabs;
  }

  byId(id: number): Prefab | undefined {
    return this.prefabs.find((prefab) => prefab.id === id);
  }

  largestFootprint(): number {
    return this.prefabs.reduce((widest, prefab) => Math.max(widest, prefabFootprintRadius(prefab)), 1);
  }

  add(): Prefab {
    return this.insert(newPrefabWithId(this.nextId++));
  }

  insert(prefab: Omit<Prefab, 'id'> & { id?: number }): Prefab {
    const added = { ...prefab, id: this.nextId++ } as Prefab;
    this.prefabs.push(added);
    this.persistAndNotify();
    for (const listener of this.addedListeners) listener(added);
    return added;
  }

  duplicate(id: number): Prefab | null {
    const original = this.byId(id);
    if (!original) return null;
    return this.insert({ ...structuredClone(original), name: `${original.name} copy` });
  }

  remove(id: number): void {
    this.prefabs = this.prefabs.filter((prefab) => prefab.id !== id);
    this.persistAndNotify();
  }

  update(id: number, patch: PrefabPatch): void {
    const prefab = this.byId(id);
    if (!prefab) return;
    Object.assign(prefab, patch);
    this.persistAndNotify();
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  onPrefabAdded(listener: PrefabAddedListener): () => void {
    this.addedListeners.add(listener);
    return () => this.addedListeners.delete(listener);
  }

  private persistAndNotify(): void {
    storePrefabs(this.prefabs);
    for (const listener of this.listeners) listener();
  }
}

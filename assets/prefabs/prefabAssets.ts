import { AssetCollection } from '../collection/assetCollection';
import { defaultPrefabs, type TileIdByName } from './defaultPrefabs';
import { newPrefabWithId, prefabFootprintRadius, type Prefab } from './prefabDef';
import { loadStoredPrefabs, storePrefabs } from './prefabStorage';

export type PrefabPatch = Partial<Omit<Prefab, 'id'>>;
export type PrefabAddedListener = (prefab: Prefab) => void;

export class PrefabAssets extends AssetCollection<Prefab> {
  private readonly addedListeners = new Set<PrefabAddedListener>();

  constructor(tileIdOf: TileIdByName, initialPrefabs?: Prefab[]) {
    super(initialPrefabs ?? loadStoredPrefabs() ?? defaultPrefabs(tileIdOf));
  }

  largestFootprint(): number {
    return this.all().reduce(
      (widest, prefab) => Math.max(widest, prefabFootprintRadius(prefab)),
      1,
    );
  }

  insert(prefab: Omit<Prefab, 'id'> & { id?: number }): Prefab {
    return this.append({ ...prefab, id: this.claimId() } as Prefab);
  }

  onPrefabAdded(listener: PrefabAddedListener): () => void {
    this.addedListeners.add(listener);
    return () => this.addedListeners.delete(listener);
  }

  protected blankAsset(id: number): Prefab {
    return newPrefabWithId(id);
  }

  protected append(prefab: Prefab): Prefab {
    const added = super.append(prefab);
    for (const listener of this.addedListeners) listener(added);
    return added;
  }

  protected store(prefabs: readonly Prefab[]): void {
    storePrefabs(prefabs);
  }
}

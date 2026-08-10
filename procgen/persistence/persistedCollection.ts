export interface PersistedCollection<Item> {
  load(): Item[];
  store(items: readonly Item[]): void;
}

export function unpersisted<Item>(): PersistedCollection<Item> {
  return { load: () => [], store: () => {} };
}

export function loadOnly<Item>(load: () => Item[]): PersistedCollection<Item> {
  return { load, store: () => {} };
}

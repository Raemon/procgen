import { defaultItems } from './defaultItems';
import { newItemWithId, type ItemDef } from './itemDef';
import { loadStoredItems, storeItems } from './itemStorage';

export type ItemPatch = Partial<Omit<ItemDef, 'id'>>;

export interface ItemSource {
  byId(id: number): ItemDef | undefined;
}

export class ItemLibrary implements ItemSource {
  private items: ItemDef[];
  private nextId: number;
  private readonly listeners = new Set<() => void>();

  constructor(initialItems?: ItemDef[]) {
    this.items = initialItems ?? loadStoredItems() ?? defaultItems();
    this.nextId = this.items.reduce((highest, item) => Math.max(highest, item.id + 1), 0);
  }

  all(): readonly ItemDef[] {
    return this.items;
  }

  byId(id: number): ItemDef | undefined {
    return this.items.find((item) => item.id === id);
  }

  add(): ItemDef {
    const item = newItemWithId(this.nextId++);
    this.items.push(item);
    this.persistAndNotify();
    return item;
  }

  duplicate(id: number): ItemDef | null {
    const original = this.byId(id);
    if (!original) return null;
    const copy = { ...structuredClone(original), id: this.nextId++, name: `${original.name} copy` };
    this.items.push(copy);
    this.persistAndNotify();
    return copy;
  }

  remove(id: number): void {
    this.items = this.items.filter((item) => item.id !== id);
    this.persistAndNotify();
  }

  update(id: number, patch: ItemPatch): void {
    const item = this.byId(id);
    if (!item) return;
    Object.assign(item, patch);
    this.persistAndNotify();
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private persistAndNotify(): void {
    storeItems(this.items);
    for (const listener of this.listeners) listener();
  }
}

export const NO_ITEMS: ItemSource = { byId: () => undefined };

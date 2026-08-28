import type { ItemId } from '@/features/asset-library/asset';

export const DROPPED_ITEM_TAG = 'dropped';

export interface DroppedItem {
  x: number;
  y: number;
  itemId: ItemId;
}

export class DroppedItemSpawns {
  private drops: DroppedItem[] = [];
  private readonly listeners = new Set<() => void>();

  at(x: number, y: number): DroppedItem[] {
    return this.drops.filter((drop) => drop.x === x && drop.y === y);
  }

  drop(item: DroppedItem): void {
    this.drops = [...this.drops, item];
    this.emit();
  }

  takeOne(x: number, y: number, itemId: ItemId): boolean {
    const index = this.drops.findIndex(
      (drop) => drop.x === x && drop.y === y && drop.itemId === itemId,
    );
    if (index < 0) return false;
    this.drops = this.drops.filter((_, at) => at !== index);
    this.emit();
    return true;
  }

  forgetAll(): void {
    this.drops = [];
    this.emit();
  }

  snapshot(): DroppedItem[] {
    return [...this.drops];
  }

  replaceAll(drops: readonly DroppedItem[]): void {
    this.drops = drops
      .filter(
        (drop) =>
          typeof drop?.x === 'number' && typeof drop?.y === 'number' && typeof drop?.itemId === 'number',
      )
      .map((drop) => ({ x: Math.round(drop.x), y: Math.round(drop.y), itemId: drop.itemId }));
    this.emit();
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => void this.listeners.delete(listener);
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }
}

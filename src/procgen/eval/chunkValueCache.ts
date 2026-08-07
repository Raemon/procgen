import type { ChunkValue } from '../values/chunkValues';

export class ChunkValueCache {
  private readonly entries = new Map<string, ChunkValue>();

  constructor(private capacity: number) {}

  growTo(capacity: number): void {
    this.capacity = Math.max(this.capacity, capacity);
  }

  get(key: string): ChunkValue | undefined {
    const value = this.entries.get(key);
    if (value !== undefined) this.markRecentlyUsed(key, value);
    return value;
  }

  set(key: string, value: ChunkValue): void {
    this.evictUntilRoomFor(key);
    this.entries.set(key, value);
  }

  private markRecentlyUsed(key: string, value: ChunkValue): void {
    this.entries.delete(key);
    this.entries.set(key, value);
  }

  private evictUntilRoomFor(key: string): void {
    if (this.entries.has(key)) return;
    while (this.entries.size >= this.capacity) {
      const oldest = this.entries.keys().next().value;
      if (oldest === undefined) return;
      this.entries.delete(oldest);
    }
  }
}

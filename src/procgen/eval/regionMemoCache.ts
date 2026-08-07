export class RegionMemoCache {
  private readonly entries = new Map<string, unknown>();

  constructor(private readonly capacity: number) {}

  at<Value>(key: string, compute: () => Value): Value {
    if (this.entries.has(key)) return this.markRecentlyUsed(key) as Value;
    const value = compute();
    this.evictOldestWhenFull();
    this.entries.set(key, value);
    return value;
  }

  private markRecentlyUsed(key: string): unknown {
    const value = this.entries.get(key);
    this.entries.delete(key);
    this.entries.set(key, value);
    return value;
  }

  private evictOldestWhenFull(): void {
    if (this.entries.size < this.capacity) return;
    const oldest = this.entries.keys().next().value;
    if (oldest !== undefined) this.entries.delete(oldest);
  }
}

import type { PuzzleRoomLayout } from './puzzleRoomLayout';

export class RoomCache {
  private readonly kept = new Map<string, PuzzleRoomLayout>();

  constructor(private readonly capacity: number) {}

  get(key: string): PuzzleRoomLayout | undefined {
    const known = this.kept.get(key);
    if (known) this.markAsFreshlyUsed(key, known);
    return known;
  }

  set(key: string, layout: PuzzleRoomLayout): void {
    this.kept.set(key, layout);
    while (this.kept.size > this.capacity) this.dropTheLeastRecentlyUsed();
  }

  clear(): void {
    this.kept.clear();
  }

  private markAsFreshlyUsed(key: string, layout: PuzzleRoomLayout): void {
    this.kept.delete(key);
    this.kept.set(key, layout);
  }

  private dropTheLeastRecentlyUsed(): void {
    const oldest = this.kept.keys().next();
    if (!oldest.done) this.kept.delete(oldest.value);
  }
}

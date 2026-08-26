import type { ItemId } from '@/features/asset-library/asset';
export interface TakenSpawnKey {
  x: number;
  y: number;
  itemId: ItemId;
}

export class TakenItemSpawns {
  private readonly taken = new Set<string>();

  take(spawn: TakenSpawnKey): void {
    this.taken.add(spawnKey(spawn));
  }

  isTaken(spawn: TakenSpawnKey): boolean {
    return this.taken.has(spawnKey(spawn));
  }

  forgetAll(): void {
    this.taken.clear();
  }

  snapshot(): TakenSpawnKey[] {
    return [...this.taken].map(spawnFromKey);
  }

  replaceAll(spawns: readonly TakenSpawnKey[]): void {
    this.taken.clear();
    for (const spawn of spawns) this.taken.add(spawnKey(spawn));
  }
}

function spawnKey(spawn: TakenSpawnKey): string {
  return `${spawn.x},${spawn.y},${spawn.itemId}`;
}

function spawnFromKey(key: string): TakenSpawnKey {
  const [x = 0, y = 0, itemId = -1] = key.split(',').map(Number);
  return { x, y, itemId: itemId as ItemId };
}

export interface TakenSpawnKey {
  x: number;
  y: number;
  itemId: number;
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
}

function spawnKey(spawn: TakenSpawnKey): string {
  return `${spawn.x},${spawn.y},${spawn.itemId}`;
}

import type { Entity, EntityRegistry } from '@/features/game/multiplayer/game/entities';
import { saveCharacter } from './characterRepo';
import type { Store } from './db';

const FLUSH_INTERVAL_MS = 10_000;

export class WriteBehind {
  private timer?: ReturnType<typeof setInterval>;

  constructor(
    private readonly store: Store,
    private readonly registry: EntityRegistry,
  ) {}

  start(): void {
    this.timer = setInterval(() => void this.flush(), FLUSH_INTERVAL_MS);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async flush(): Promise<void> {
    if (!this.store.enabled) return;
    const jobs: Promise<void>[] = [];
    for (const entity of this.registry.byId.values()) {
      if (entity.kind !== 'player' || !entity.persistDirty) continue;
      entity.persistDirty = false;
      jobs.push(this.persistOne(entity));
    }
    await Promise.all(jobs);
  }

  persistOne(entity: Entity): Promise<void> {
    const { characterId, name, x, y, facing } = entity;
    return saveCharacter(this.store, { id: characterId, name, x, y, facing }).catch((err) => {
      console.warn(`[persist] character ${characterId} failed`, err);
    });
  }
}

import type { LiveCreature, LiveCreatureSource } from '../../creatureSim/creatureInstance';
import type { CreatureId } from '@/features/asset-library/asset';
import type { CreatureRow } from './protocol';

export class RemoteCreatures implements LiveCreatureSource {
  private creatures: LiveCreature[] = [];

  applyRows(rows: readonly CreatureRow[]): void {
    this.creatures = rows.map(([id, creatureId, x, y, heading, moving, hp]) => ({
      id,
      key: `net:${id}`,
      creatureId: creatureId as CreatureId,
      x,
      y,
      heading,
      moving: moving === 1,
      hp,
    }));
  }

  active(): readonly LiveCreature[] {
    return this.creatures;
  }

  clear(): void {
    this.creatures = [];
  }
}

import type { EntityKind } from '../client/protocol';
import { restingBody, type MovementOrder } from '../../sim/movementOrder';
import type { FacingIndex } from '../../facing';

export interface Entity {
  id: number;
  characterId: string;
  name: string;
  kind: EntityKind;
  x: number;
  y: number;
  facing: FacingIndex;
  cooldown: number;
  moveDir: number;
  order: MovementOrder;
  persistDirty: boolean;
}

export class EntityRegistry {
  private nextId = 1;
  readonly byId = new Map<number, Entity>();

  add(characterId: string, name: string, kind: EntityKind, x: number, y: number, facing: FacingIndex): Entity {
    const entity: Entity = {
      id: this.nextId++,
      characterId,
      name,
      kind,
      x,
      y,
      facing,
      ...restingBody(),
      persistDirty: false,
    };
    this.byId.set(entity.id, entity);
    return entity;
  }

  remove(id: number): void {
    this.byId.delete(id);
  }

  findByCharacterId(characterId: string): Entity | undefined {
    for (const entity of this.byId.values()) if (entity.characterId === characterId) return entity;
    return undefined;
  }

  moveTo(entity: Entity, x: number, y: number): void {
    entity.x = x;
    entity.y = y;
    entity.persistDirty = true;
  }

  faceToward(entity: Entity, facing: FacingIndex): void {
    entity.facing = facing;
    entity.persistDirty = true;
  }

  countByKind(kind: EntityKind): number {
    let count = 0;
    for (const entity of this.byId.values()) if (entity.kind === kind) count++;
    return count;
  }
}

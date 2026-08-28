import type { ItemId } from '@/features/asset-library/asset';

export interface CombatActor {
  id: number;
  name: string;
  x: number;
  y: number;
}

export type CombatEvent =
  | {
      kind: 'creature_hit_actor';
      creatureKey: string;
      creatureName: string;
      actorId: number;
      actorName: string;
      damage: number;
    }
  | {
      kind: 'actor_hit_creature';
      actorId: number;
      actorName: string;
      creatureKey: string;
      creatureName: string;
      damage: number;
      remainingHp: number;
      maxHp: number;
    }
  | {
      kind: 'creature_slain';
      creatureKey: string;
      creatureName: string;
      actorId: number;
      actorName: string;
      x: number;
      y: number;
      droppedItemIds: ItemId[];
    };

export type CombatListener = (event: CombatEvent) => void;

export function combatEventText(event: CombatEvent): string {
  if (event.kind === 'creature_hit_actor') {
    return `${event.creatureName} hits ${event.actorName} for ${event.damage}`;
  }
  if (event.kind === 'actor_hit_creature') {
    return `${event.actorName} hits ${event.creatureName} for ${event.damage} (${event.remainingHp}/${event.maxHp} hp)`;
  }
  return `${event.actorName} slays ${event.creatureName}`;
}

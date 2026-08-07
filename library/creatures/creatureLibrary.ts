import { newCharacterWithId, newCreatureWithId, type CreatureDef } from './creatureDef';
import { loadStoredCreatures, storeCreatures } from './creatureStorage';
import { defaultCreatures } from './defaultCreatures';

export type CreaturePatch = Partial<Omit<CreatureDef, 'id'>>;

export class CreatureLibrary {
  private creatures: CreatureDef[];
  private nextId: number;
  private readonly listeners = new Set<() => void>();

  constructor(initialCreatures?: CreatureDef[]) {
    this.creatures = initialCreatures ?? loadStoredCreatures() ?? defaultCreatures();
    this.nextId = this.creatures.reduce((highest, creature) => Math.max(highest, creature.id + 1), 0);
  }

  all(): readonly CreatureDef[] {
    return this.creatures;
  }

  byId(id: number): CreatureDef | undefined {
    return this.creatures.find((creature) => creature.id === id);
  }

  add(): CreatureDef {
    return this.append(newCreatureWithId(this.nextId++));
  }

  addCharacter(): CreatureDef {
    return this.append(newCharacterWithId(this.nextId++));
  }

  duplicate(id: number): CreatureDef | null {
    const original = this.byId(id);
    if (!original) return null;
    const copy = { ...structuredClone(original), id: this.nextId++, name: `${original.name} copy` };
    this.creatures.push(copy);
    this.persistAndNotify();
    return copy;
  }

  remove(id: number): void {
    this.creatures = this.creatures.filter((creature) => creature.id !== id);
    this.persistAndNotify();
  }

  update(id: number, patch: CreaturePatch): void {
    const creature = this.byId(id);
    if (!creature) return;
    Object.assign(creature, patch);
    this.persistAndNotify();
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private append(creature: CreatureDef): CreatureDef {
    this.creatures.push(creature);
    this.persistAndNotify();
    return creature;
  }

  private persistAndNotify(): void {
    storeCreatures(this.creatures);
    for (const listener of this.listeners) listener();
  }
}

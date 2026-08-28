import type { AgentApiState } from '../../../agents/api/nodeEntry';
import { currentServerWorld, type DocSource, type ServerWorld } from '../../../agents/api/serverWorld';
import type { CombatActor, CombatEvent, CombatListener } from '../../creatureSim/combatEvents';
import { CreatureSim } from '../../creatureSim/creatureSim';
import type { EntityRegistry } from './entities';

export interface WorldHost {
  current(): ServerWorld;
  liveCreatures(): CreatureSim;
  onCombat(listener: CombatListener): () => void;
}

export function createWorldHost(
  state: AgentApiState,
  docs: DocSource,
  registry: EntityRegistry,
): WorldHost {
  const listeners = new Set<CombatListener>();
  const emit = (event: CombatEvent) => {
    for (const listener of listeners) listener(event);
  };
  const actors = (): readonly CombatActor[] =>
    [...registry.byId.values()].map((entity) => ({
      id: entity.id,
      name: entity.name,
      x: entity.x,
      y: entity.y,
    }));
  const host: WorldHost = {
    current() {
      const world = currentServerWorld(docs, state.world);
      if (world.liveCreatures === null) {
        world.liveCreatures = new CreatureSim({
          sampler: world.sampler,
          creatureAssets: world.creatures,
          world: { actors },
          isWalkableAt: world.isWalkable,
          slain: world.slainCreatures,
          onCombat: emit,
        });
      }
      state.world = world;
      return world;
    },
    liveCreatures() {
      return host.current().liveCreatures!;
    },
    onCombat(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
  };
  return host;
}

import type { AgentApiState } from '../../api/agent/nodeEntry';
import { currentServerWorld, type DocSource } from '../../api/agent/persistedServerWorld';
import type { ServerWorld } from '../../api/agent/serverWorld';

export interface WorldHost {
  current(): ServerWorld;
}

export function createWorldHost(state: AgentApiState, docs: DocSource): WorldHost {
  return {
    current() {
      state.world = currentServerWorld(docs, state.world);
      return state.world;
    },
  };
}

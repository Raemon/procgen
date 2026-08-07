import type { AgentApiState } from '../../src/agent/api/nodeEntry';
import { currentServerWorld, type DocSource, type ServerWorld } from '../../src/agent/api/serverWorld';

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

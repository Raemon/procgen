import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleApiRequest } from './handlers';
import {
  currentServerWorld,
  persistWorld,
  type ServerWorld,
  type WorldAccess,
} from './serverWorld';
import type { SessionStore } from './sessions';

export interface AgentApiState {
  sessions: SessionStore;
  world: ServerWorld | null;
}

export function newAgentApiState(): AgentApiState {
  return { sessions: new Map(), world: null };
}

export async function serveAgentApi(
  state: AgentApiState,
  root: string,
  req: IncomingMessage,
  res: ServerResponse,
  onPipelinePersisted?: () => void,
): Promise<void> {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const response = handleApiRequest(state.sessions, worldAccess(state, root, onPipelinePersisted), {
    method: req.method ?? 'GET',
    path: url.pathname.replace(/^\/api\/v1/, '') || '/',
    query: url.searchParams,
    body: await readJsonBody(req),
  });
  res.statusCode = response.status;
  res.setHeader('content-type', response.contentType);
  res.end(response.body);
}

function worldAccess(
  state: AgentApiState,
  root: string,
  onPipelinePersisted?: () => void,
): WorldAccess {
  return {
    current: () => {
      state.world = currentServerWorld(root, state.world);
      return state.world;
    },
    persistWorld: (world) => {
      persistWorld(root, world);
      onPipelinePersisted?.();
    },
  };
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const raw = await new Promise<string>((resolve) => {
    let collected = '';
    req.on('data', (piece: Buffer) => (collected += piece.toString()));
    req.on('end', () => resolve(collected));
  });
  if (raw === '') return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

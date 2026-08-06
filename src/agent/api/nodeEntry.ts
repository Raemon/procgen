import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleApiRequest } from './handlers';
import { currentServerWorld, type ServerWorld } from './serverWorld';
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
): Promise<void> {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const response = handleApiRequest(state.sessions, worldProvider(state, root), {
    method: req.method ?? 'GET',
    path: url.pathname.replace(/^\/api\/v1/, '') || '/',
    query: url.searchParams,
    body: await readJsonBody(req),
  });
  res.statusCode = response.status;
  res.setHeader('content-type', response.contentType);
  res.end(response.body);
}

function worldProvider(state: AgentApiState, root: string): () => ServerWorld {
  return () => {
    state.world = currentServerWorld(root, state.world);
    return state.world;
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

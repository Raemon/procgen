import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleApiRequest } from './handleApiRequest';
import {
  currentServerWorld,
  persistWorld,
  type DocSink,
  type DocSource,
  type ServerWorld,
  type WorldAccess,
} from './serverWorld';
import type { SessionStore } from './sessions';
import { WorldLab } from '@/features/asset-library/worlds/lab/worldLab';

export interface AgentApiState {
  sessions: SessionStore;
  world: ServerWorld | null;
  lab: WorldLab;
}

export function newAgentApiState(): AgentApiState {
  return { sessions: new Map(), world: null, lab: new WorldLab() };
}

export async function serveAgentApi(
  state: AgentApiState,
  docs: DocSource & DocSink,
  req: IncomingMessage,
  res: ServerResponse,
  onPipelinePersisted?: () => void,
): Promise<void> {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const response = handleApiRequest(state.sessions, worldAccess(state, docs, onPipelinePersisted), {
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
  docs: DocSource & DocSink,
  onPipelinePersisted?: () => void,
): WorldAccess {
  return {
    lab: state.lab,
    current: () => {
      state.world = currentServerWorld(docs, state.world);
      return state.world;
    },
    persistWorld: (world) => {
      persistWorld(docs, world);
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

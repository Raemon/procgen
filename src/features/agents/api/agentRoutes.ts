import {
  MAX_CHARACTER_SIGHT_RADIUS_TILES,
  MIN_CHARACTER_SIGHT_RADIUS_TILES,
  clampSightRadiusTiles,
} from '@/features/game/vision/characterSight';
import {
  MAX_GOD_VIEW_SIZE_TILES,
  MIN_GOD_VIEW_SIZE_TILES,
  clampGodViewSizeTiles,
} from '@/features/game/vision/godViewSize';
import { isAgentMode, type AgentMode } from '../agentMode';
import { commandsForMode } from '@/features/app-shell/runtime/commands/commandCatalog';
import { buildObservation, type AgentObservation } from '../observation';
import { observationText } from '../observationText';
import { startAutopilot } from './autopilot';
import { creatureAwareOverlay } from '../creatureMarkers';
import type { ServerWorld, WorldAccess } from './serverWorld';
import {
  newSession,
  sessionPose,
  sessionVision,
  type AgentSession,
  type SessionStore,
} from './sessions';
import { failure, json, type ApiRequest, type ApiResponse } from './apiMessages';
import { registerRoute, type RouteContext } from './routeRegistry';

registerRoute({
  method: 'GET',
  path: '/agents',
  summary: 'list agents',
  body: {},
  query: {},
  handle: ({ sessions }) => json(200, { agents: [...sessions.values()].map(agentJson) }),
});

registerRoute({
  method: 'POST',
  path: '/agents',
  summary: 'create an agent; responds with its id and urls',
  body: {
    mode: { kind: 'text', help: '"god" or "character" — an agent keeps its mode for life' },
    name: { kind: 'text', help: 'what to call it in listings; defaults to its id', optional: true },
    sight_radius_tiles: {
      kind: 'int',
      help: 'how far a character sees, clamped to the supported range',
      optional: true,
    },
    view_size_tiles: {
      kind: 'int',
      help: 'how wide a god window is, in tiles; even sizes round to odd and out-of-range values are clamped',
      optional: true,
    },
  },
  query: {},
  handle: ({ sessions, access, req }) => createAgent(sessions, access.current(), req.body),
});

registerRoute({
  method: 'GET',
  path: '/agents/{id}',
  summary: "the agent's current state",
  body: {},
  query: {},
  handle: (context) => withSession(context, (session) => json(200, { agent: agentJson(session) })),
});

registerRoute({
  method: 'DELETE',
  path: '/agents/{id}',
  summary: 'remove the agent',
  body: {},
  query: {},
  handle: (context) =>
    withSession(context, (session) => {
      stopRun(session);
      context.sessions.delete(session.id);
      return json(200, { deleted: true, id: session.id });
    }),
});

registerRoute({
  method: 'GET',
  path: '/agents/{id}/observe',
  summary: 'a fresh observation, regenerated from the world as it stands right now',
  body: {},
  query: {
    format: { kind: 'text', help: '"json" or "text"; text is the grid an agent view renders', optional: true },
    sight_radius_tiles: {
      kind: 'int',
      help: "widen or narrow the character's sight before looking; the new radius sticks",
      optional: true,
    },
    view_size_tiles: {
      kind: 'int',
      help: 'widen or narrow the god window before looking; the new size sticks',
      optional: true,
    },
  },
  handle: (context) =>
    withSession(context, (session) => observe(session, context.access.current(), context.req)),
});

registerRoute({
  method: 'POST',
  path: '/agents/{id}/run',
  summary:
    'start an autopilot run that drives this agent with an LLM. budget_usd (default 1, max 100) caps what the run may spend at list prices, and the run stops before the first turn that would start over budget, so its final turn can carry it slightly past',
  body: {
    goal: { kind: 'text', help: 'what the run should achieve, in a sentence' },
    model: { kind: 'text', help: 'the model to drive it; defaults to claude-sonnet-5', optional: true },
    budget_usd: {
      kind: 'number',
      help: 'what the run may spend at list prices, default 1 and capped at 100',
      optional: true,
    },
    anthropic_api_key: {
      kind: 'text',
      help: 'falls back to the ANTHROPIC_API_KEY environment variable',
      optional: true,
    },
  },
  query: {},
  handle: (context) =>
    withSession(context, (session) => run(session, context.access, context.req.body)),
});

registerRoute({
  method: 'POST',
  path: '/agents/{id}/stop',
  summary: 'stop the autopilot run',
  body: {},
  query: {},
  handle: (context) =>
    withSession(context, (session) => {
      stopRun(session);
      return json(200, { agent: agentJson(session) });
    }),
});

registerRoute({
  method: 'GET',
  path: '/agents/{id}/transcript',
  summary: 'the autopilot transcript',
  body: {},
  query: { after: { kind: 'int', help: 'return only entries after this seq', optional: true } },
  handle: (context) => withSession(context, (session) => transcript(session, context.req)),
});

function withSession(
  context: RouteContext,
  use: (session: AgentSession) => ApiResponse,
): ApiResponse {
  const session = context.sessions.get(context.params.id!);
  if (!session) return failure(404, 'unknown_agent', `no agent ${context.params.id}`);
  return use(session);
}

function createAgent(sessions: SessionStore, world: ServerWorld, body: unknown): ApiResponse {
  const mode = (body as { mode?: unknown } | null)?.mode;
  if (!isAgentMode(mode)) {
    return failure(400, 'bad_request', 'body must be {"mode": "god" | "character"}');
  }
  const sightRadius = readTiles(
    (body as { sight_radius_tiles?: unknown } | null)?.sight_radius_tiles,
    clampSightRadiusTiles,
  );
  if (sightRadius === 'invalid') return failure(400, 'invalid_value', sightRadiusHint('"sight_radius_tiles"'));
  const viewSize = readTiles(
    (body as { view_size_tiles?: unknown } | null)?.view_size_tiles,
    clampGodViewSizeTiles,
  );
  if (viewSize === 'invalid') return failure(400, 'invalid_value', viewSizeHint('"view_size_tiles"'));
  const id = `agent_${Math.random().toString(36).slice(2, 10)}`;
  const name = readName(body) ?? id;
  const session = newSession(id, name, mode, world.spawn(), {
    sightRadiusTiles: sightRadius ?? undefined,
    godViewSizeTiles: viewSize ?? undefined,
  });
  sessions.set(id, session);
  return json(201, {
    agent: agentJson(session),
    urls: {
      docs: '/api/v1/openapi.json',
      observe: `/api/v1/agents/${id}/observe`,
      pipeline: '/api/v1/asset-library/world-seeds/current',
      node_types: '/api/v1/asset-library/node-types',
    },
  });
}

function readTiles(raw: unknown, clamp: (tiles: number) => number): number | null | 'invalid' {
  if (raw === undefined || raw === null) return null;
  const value = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : NaN;
  if (!Number.isFinite(value)) return 'invalid';
  return clamp(value);
}

function sightRadiusHint(name: string): string {
  return `${name} takes a number of tiles (${MIN_CHARACTER_SIGHT_RADIUS_TILES}-${MAX_CHARACTER_SIGHT_RADIUS_TILES}; out-of-range values are clamped)`;
}

function viewSizeHint(name: string): string {
  return `${name} takes a number of tiles (${MIN_GOD_VIEW_SIZE_TILES}-${MAX_GOD_VIEW_SIZE_TILES}; even sizes round to odd, out-of-range values are clamped)`;
}

function readName(body: unknown): string | null {
  const name = (body as { name?: unknown } | null)?.name;
  return typeof name === 'string' && name.trim() !== '' ? name.trim().slice(0, 24) : null;
}

function observe(session: AgentSession, world: ServerWorld, req: ApiRequest): ApiResponse {
  const asked = readTiles(req.query.get('sight_radius_tiles'), clampSightRadiusTiles);
  if (asked === 'invalid') return failure(400, 'invalid_value', sightRadiusHint('sight_radius_tiles'));
  if (asked !== null) session.sightRadiusTiles = asked;
  const askedSize = readTiles(req.query.get('view_size_tiles'), clampGodViewSizeTiles);
  if (askedSize === 'invalid') return failure(400, 'invalid_value', viewSizeHint('view_size_tiles'));
  if (askedSize !== null) session.godViewSizeTiles = askedSize;
  const observation = buildObservation(
    world.sampler,
    world.tileAssets,
    sessionPose(session),
    session.mode,
    sessionVision(session),
    creatureAwareOverlay(world),
  );
  if (req.query.get('format') === 'text') {
    return { status: 200, contentType: 'text/plain; charset=utf-8', body: observationText(observation) };
  }
  return json(200, { observation: observationJson(session.mode, observation) });
}

function run(session: AgentSession, access: WorldAccess, body: unknown): ApiResponse {
  if (session.run?.status === 'running') {
    return failure(409, 'agent_busy', 'stop the current run first');
  }
  const opts = body as {
    goal?: unknown;
    model?: unknown;
    budget_usd?: unknown;
    anthropic_api_key?: unknown;
  } | null;
  const goal = typeof opts?.goal === 'string' && opts.goal.trim() !== '' ? opts.goal.trim() : null;
  if (!goal) return failure(400, 'bad_request', 'body must include a "goal" string');
  startAutopilot(session, access, {
    goal,
    model: typeof opts?.model === 'string' ? opts.model : 'claude-sonnet-5',
    budgetUsd: clampBudget(opts?.budget_usd),
    apiKey:
      typeof opts?.anthropic_api_key === 'string' && opts.anthropic_api_key !== ''
        ? opts.anthropic_api_key
        : (process.env.ANTHROPIC_API_KEY ?? null),
  });
  return json(202, { agent: agentJson(session) });
}

function clampBudget(raw: unknown): number {
  const usd = typeof raw === 'number' && Number.isFinite(raw) ? raw : 1;
  return Math.max(0.01, Math.min(100, usd));
}

function stopRun(session: AgentSession): void {
  if (session.run?.status === 'running') session.run.stopRequested = true;
}

function transcript(session: AgentSession, req: ApiRequest): ApiResponse {
  const after = Number(req.query.get('after') ?? 0);
  const entries = (session.run?.transcript ?? []).filter((entry) => entry.seq > after);
  return json(200, { run_status: session.run?.status ?? 'idle', entries });
}

function agentJson(session: AgentSession) {
  return {
    id: session.id,
    name: session.name,
    mode: session.mode,
    position: { x: session.x, y: session.y },
    sight_radius_tiles: session.mode === 'character' ? session.sightRadiusTiles : null,
    view_size_tiles: session.mode === 'god' ? session.godViewSizeTiles : null,
    last_action: session.lastAction,
    run_status: session.run?.status ?? 'idle',
    run_goal: session.run?.goal ?? null,
    run_steps: session.run?.steps ?? 0,
    run_budget_usd: session.run?.budgetUsd ?? null,
    run_spent_usd: session.run?.spentUsd ?? null,
    notebook_notes: session.notebook.notes.length,
    notebook_scripts: session.notebook.scripts.length,
    created_at: session.createdAt,
  };
}

function observationJson(mode: AgentMode, observation: AgentObservation) {
  return {
    mode: observation.mode,
    position: observation.position,
    facing: observation.facing,
    grid_orientation: 'north-up',
    view_size: observation.viewSize,
    sight_radius_tiles: observation.sightRadiusTiles,
    view_size_tiles: observation.godViewSizeTiles,
    view: observation.view,
    elevation: observation.elevation,
    legend: observation.legend,
    available_actions: commandsForMode(mode).map((spec) => ({
      action: spec.action,
      params: Object.fromEntries(
        Object.entries(spec.params).map(([name, param]) => [
          name,
          param.optional ? `${param.help} (optional)` : param.help,
        ]),
      ),
      description: spec.description,
    })),
  };
}


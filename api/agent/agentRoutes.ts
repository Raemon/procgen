import {
  DEFAULT_CHARACTER_SIGHT_RADIUS_TILES,
  MAX_CHARACTER_SIGHT_RADIUS_TILES,
  MIN_CHARACTER_SIGHT_RADIUS_TILES,
  clampSightRadiusTiles,
} from '../../world/vision/characterSight';
import { isAgentMode, type AgentMode } from '../../agents/agentMode';
import { abilitiesForMode } from '../../abilities/abilityRegistry';
import { pipelineJson } from '../../agents/nodeCatalog';
import { buildObservation, type AgentObservation } from '../../agents/observation';
import { observationText } from '../../agents/observationText';
import { startAutopilot } from './autopilot';
import { performVerb } from './performVerb';
import type { ServerWorld, WorldAccess } from './serverWorld';
import { newSession, sessionPose, type AgentSession, type SessionStore } from './sessions';
import { failure, json, type ApiRequest, type ApiResponse } from './apiMessages';
import { registerRoute, type RouteContext } from './routeRegistry';

registerRoute({
  method: 'GET',
  path: '/agents',
  summary: 'list agents',
  body: '—',
  handle: ({ sessions }) => json(200, { agents: [...sessions.values()].map(agentJson) }),
});

registerRoute({
  method: 'POST',
  path: '/agents',
  summary: 'create an agent; responds with its id and urls',
  body: '{"mode": "god" or "character", "name": optional, "sight_radius_tiles": optional}',
  handle: ({ sessions, access, req }) => createAgent(sessions, access.current(), req.body),
});

registerRoute({
  method: 'GET',
  path: '/agents/{id}',
  summary: "the agent's current state",
  body: '—',
  handle: (context) => withSession(context, (session) => json(200, { agent: agentJson(session) })),
});

registerRoute({
  method: 'DELETE',
  path: '/agents/{id}',
  summary: 'remove the agent',
  body: '—',
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
  summary:
    'a fresh observation. add &sight_radius_tiles=N to widen or narrow the character\'s sight first (clamped); the new radius sticks. format=json or text',
  body: '—',
  handle: (context) =>
    withSession(context, (session) => observe(session, context.access.current(), context.req)),
});

registerRoute({
  method: 'POST',
  path: '/agents/{id}/act',
  summary: 'perform one action; responds with the outcome and a fresh observation',
  body: '{"action": "...", ...params}',
  handle: (context) =>
    withSession(context, (session) => act(session, context.access, context.req.body)),
});

registerRoute({
  method: 'POST',
  path: '/agents/{id}/run',
  summary:
    'start an autopilot run that drives this agent with an LLM. budget_usd (default 1, max 100) caps what the run may spend at list prices, and the run stops before the first turn that would start over budget, so its final turn can carry it slightly past',
  body: '{"goal": "...", "model": optional, "budget_usd": optional, "anthropic_api_key": optional}',
  handle: (context) =>
    withSession(context, (session) => run(session, context.access, context.req.body)),
});

registerRoute({
  method: 'POST',
  path: '/agents/{id}/stop',
  summary: 'stop the autopilot run',
  body: '—',
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
  body: '—',
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
  const sightRadius = readSightRadius((body as { sight_radius_tiles?: unknown } | null)?.sight_radius_tiles);
  if (sightRadius === 'invalid') {
    return failure(
      400,
      'invalid_value',
      `"sight_radius_tiles" takes a number of tiles (${MIN_CHARACTER_SIGHT_RADIUS_TILES}-${MAX_CHARACTER_SIGHT_RADIUS_TILES}; out-of-range values are clamped)`,
    );
  }
  const id = `agent_${Math.random().toString(36).slice(2, 10)}`;
  const name = readName(body) ?? id;
  const session = newSession(
    id,
    name,
    mode,
    world.spawn(),
    sightRadius ?? DEFAULT_CHARACTER_SIGHT_RADIUS_TILES,
  );
  sessions.set(id, session);
  return json(201, {
    agent: agentJson(session),
    urls: {
      docs: '/api/v1/docs',
      observe: `/api/v1/agents/${id}/observe`,
      act: `/api/v1/agents/${id}/act`,
      pipeline: '/api/v1/pipeline',
      node_types: '/api/v1/node-types',
    },
  });
}

/** null when absent, 'invalid' when present but not a number, otherwise the clamped radius. */
function readSightRadius(raw: unknown): number | null | 'invalid' {
  if (raw === undefined || raw === null) return null;
  const value = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : NaN;
  if (!Number.isFinite(value)) return 'invalid';
  return clampSightRadiusTiles(value);
}

function readName(body: unknown): string | null {
  const name = (body as { name?: unknown } | null)?.name;
  return typeof name === 'string' && name.trim() !== '' ? name.trim().slice(0, 24) : null;
}

function observe(session: AgentSession, world: ServerWorld, req: ApiRequest): ApiResponse {
  const asked = readSightRadius(req.query.get('sight_radius_tiles'));
  if (asked === 'invalid') {
    return failure(
      400,
      'invalid_value',
      `sight_radius_tiles takes a number of tiles (${MIN_CHARACTER_SIGHT_RADIUS_TILES}-${MAX_CHARACTER_SIGHT_RADIUS_TILES}; out-of-range values are clamped)`,
    );
  }
  if (asked !== null) session.sightRadiusTiles = asked;
  const observation = buildObservation(
    world.sampler,
    world.tileset,
    sessionPose(session),
    session.mode,
    session.sightRadiusTiles,
  );
  if (req.query.get('format') === 'text') {
    return { status: 200, contentType: 'text/plain; charset=utf-8', body: observationText(observation) };
  }
  return json(200, { observation: observationJson(session.mode, observation) });
}

function act(session: AgentSession, access: WorldAccess, body: unknown): ApiResponse {
  const record = body as Record<string, unknown> | null;
  const action = record?.action;
  if (typeof action !== 'string') {
    return failure(400, 'bad_request', 'body must be {"action": "...", ...params}');
  }
  const { action: _dropped, ...params } = record!;
  const world = access.current();
  const result = performVerb(session, world, action, params);
  if (result.changedPipeline) access.persistWorld(world);
  const fresh = result.changedPipeline ? access.current() : world;
  const observation = buildObservation(
    fresh.sampler,
    fresh.tileset,
    sessionPose(session),
    session.mode,
    session.sightRadiusTiles,
  );
  return json(result.outcome === 'unknown_action' || result.outcome === 'failed' ? 400 : 200, {
    outcome: result.outcome,
    summary: result.summary,
    failure: result.failure,
    pipeline: result.changedPipeline ? pipelineJson(fresh.store) : undefined,
    observation: observationJson(session.mode, observation),
  });
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
    view: observation.view,
    legend: observation.legend,
    available_actions: abilitiesForMode(mode).map((spec) => ({
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



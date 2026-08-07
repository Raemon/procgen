import { examplePipelines } from '../../procgen/presets/examplePipelines';
import {
  DEFAULT_CHARACTER_SIGHT_RADIUS_TILES,
  MAX_CHARACTER_SIGHT_RADIUS_TILES,
  MIN_CHARACTER_SIGHT_RADIUS_TILES,
  clampSightRadiusTiles,
} from '../../world/vision/characterSight';
import { isAgentMode, type AgentMode } from '../agentMode';
import { buildApiDocs } from '../apiDocs';
import { abilitiesForMode } from '../../abilities/abilityRegistry';
import { failureByCode } from '../failures';
import { nodeTypesJson, pipelineJson } from '../nodeCatalog';
import { buildObservation, type AgentObservation } from '../observation';
import { observationText } from '../observationText';
import { startAutopilot } from './autopilot';
import { creatureJson, inventoryJson, itemJson } from './libraryJson';
import { performVerb } from './performVerb';
import type { ServerWorld, WorldAccess } from './serverWorld';
import { newSession, sessionPose, type AgentSession, type SessionStore } from './sessions';

export interface ApiRequest {
  method: string;
  path: string;
  query: URLSearchParams;
  body: unknown;
}

export interface ApiResponse {
  status: number;
  contentType: string;
  body: string;
}

export function handleApiRequest(
  sessions: SessionStore,
  access: WorldAccess,
  req: ApiRequest,
): ApiResponse {
  const world = access.current();
  if (req.path === '/docs' && req.method === 'GET') {
    return { status: 200, contentType: 'text/markdown', body: buildApiDocs(world.tileset) };
  }
  if (req.path === '/pipeline' && req.method === 'GET') {
    return json(200, { pipeline: pipelineJson(world.store) });
  }
  if (req.path === '/node-types' && req.method === 'GET') {
    return json(200, nodeTypesJson());
  }
  if (req.path === '/tiles' && req.method === 'GET') {
    return json(200, {
      tiles: world.tileset.all().map((tile) => ({
        id: tile.id,
        name: tile.name,
        symbol: tile.symbol,
        color: tile.color,
        walkable: tile.walkable,
        height: tile.height,
        light: tile.light,
        light_ink: tile.lightInk,
        has_face_art: tile.faceArt !== null,
      })),
    });
  }
  if (req.path === '/templates' && req.method === 'GET') {
    return json(200, {
      templates: world.templates.all().map((template) => ({
        name: template.name,
        description: template.description,
        node_count: template.nodes.length,
        saved: world.templates.savedTemplates().some((each) => each.name === template.name),
      })),
    });
  }
  if (req.path === '/presets' && req.method === 'GET') {
    return json(200, {
      presets: [
        ...examplePipelines().map((preset) => ({
          name: preset.name,
          description: preset.description ?? '',
          saved: false,
        })),
        ...world.worldPresets.savedPresets().map((preset) => ({
          name: preset.name,
          description: preset.description,
          saved: true,
        })),
      ],
    });
  }
  if (req.path === '/prefabs' && req.method === 'GET') {
    return json(200, {
      prefabs: world.prefabs.all().map((prefab) => ({
        id: prefab.id,
        name: prefab.name,
        width: prefab.width,
        depth: prefab.depth,
        layers: prefab.layers,
      })),
    });
  }
  if (req.path === '/creatures' && req.method === 'GET') {
    return json(200, { creatures: world.creatures.all().map(creatureJson) });
  }
  if (req.path === '/items' && req.method === 'GET') {
    return json(200, { items: world.items.all().map(itemJson) });
  }
  const inventoryMatch = req.path.match(/^\/creatures\/(\d+)\/inventory$/);
  if (inventoryMatch && req.method === 'GET') {
    return creatureInventory(world, Number(inventoryMatch[1]));
  }
  if (req.path === '/agents') return agentCollection(sessions, world, req);
  const match = req.path.match(/^\/agents\/([^/]+)(\/[a-z]+)?$/);
  if (match) return agentResource(sessions, access, req, match[1]!, match[2] ?? '');
  return failure(404, 'bad_request', `no route for ${req.method} ${req.path}`);
}

function creatureInventory(world: ServerWorld, creatureId: number): ApiResponse {
  const creature = world.creatures.byId(creatureId);
  if (!creature) return failure(404, 'unknown_creature', `no creature ${creatureId}`);
  if (!creature.inventory) {
    return failure(404, 'no_inventory', `creature ${creatureId} has no inventory grid`);
  }
  return json(200, { creature_id: creatureId, inventory: inventoryJson(creature.inventory) });
}

function agentCollection(sessions: SessionStore, world: ServerWorld, req: ApiRequest): ApiResponse {
  if (req.method === 'GET') {
    return json(200, { agents: [...sessions.values()].map(agentJson) });
  }
  if (req.method === 'POST') return createAgent(sessions, world, req.body);
  return failure(405, 'bad_request', 'use GET or POST on /agents');
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

function agentResource(
  sessions: SessionStore,
  access: WorldAccess,
  req: ApiRequest,
  id: string,
  sub: string,
): ApiResponse {
  const session = sessions.get(id);
  if (!session) return failure(404, 'unknown_agent', `no agent ${id}`);
  if (sub === '' && req.method === 'GET') return json(200, { agent: agentJson(session) });
  if (sub === '' && req.method === 'DELETE') {
    stopRun(session);
    sessions.delete(id);
    return json(200, { deleted: true, id });
  }
  if (sub === '/observe' && req.method === 'GET') return observe(session, access.current(), req);
  if (sub === '/act' && req.method === 'POST') return act(session, access, req.body);
  if (sub === '/run' && req.method === 'POST') return run(session, access, req.body);
  if (sub === '/stop' && req.method === 'POST') {
    stopRun(session);
    return json(200, { agent: agentJson(session) });
  }
  if (sub === '/transcript' && req.method === 'GET') return transcript(session, req);
  return failure(404, 'bad_request', `no route for ${req.method} ${req.path}`);
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

function json(status: number, body: unknown): ApiResponse {
  return { status, contentType: 'application/json', body: JSON.stringify(body, null, 2) };
}

function failure(status: number, code: string, hint: string): ApiResponse {
  const spec = failureByCode(code);
  return json(status, {
    error: code,
    meaning: spec?.meaning ?? code,
    recovery: spec?.recovery ?? 'See GET /api/v1/docs.',
    hint,
  });
}

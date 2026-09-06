import { failure, json, type ApiResponse } from '@/features/agents/api/apiMessages';
import { registerRoute, type RouteContext } from '@/features/agents/api/routeRegistry';
import { nodeTypeOf } from '../nodeRegistry';
import { defaultParams, type NodeTypeDef, type ParamValue } from '../nodeType';
import type { BuildProgress, BuildRequest } from '../eval/builtValues';

registerRoute({
  method: 'POST',
  path: '/asset-library/world-seeds/builds',
  summary:
    'ask the server to build a whole-world node for one seed and set of params; answers with the build to poll under /asset-library/world-seeds/builds/{key}. The running world asks for its own builds, so this is for previews and edits not yet saved',
  body: {
    node_type: { kind: 'text', help: 'a node type whose generator builds the whole world at once' },
    seed: { kind: 'int', help: 'the world seed number the build is for' },
    params: { kind: 'json', help: "the node's params as {name: number}; missing ones take their defaults", optional: true },
  },
  query: {},
  handle: (context) => requestBuild(context),
});

registerRoute({
  method: 'GET',
  path: '/asset-library/world-seeds/builds/{key}',
  summary: 'how far along a whole-world build is, and once it is ready the built value itself',
  body: {},
  query: {},
  handle: (context) => buildStatus(context),
});

function requestBuild(context: RouteContext): ApiResponse {
  const body = (context.req.body ?? {}) as { node_type?: unknown; seed?: unknown; params?: unknown };
  const def = typeof body.node_type === 'string' ? nodeTypeOf(body.node_type) : undefined;
  if (!def || !def.wholeWorld) {
    return failure(400, 'unknown_node_type', `no whole-world node type '${String(body.node_type)}'`);
  }
  const seed = typeof body.seed === 'number' && Number.isFinite(body.seed) ? Math.round(body.seed) : null;
  if (seed === null) return failure(400, 'invalid_value', '"seed" must be a whole number');
  const request: BuildRequest = { nodeType: def.type, seed, params: paramsOf(def, body.params) };
  const progress = context.access.builds.request(request);
  return buildResponse(context, progress);
}

function buildStatus(context: RouteContext): ApiResponse {
  const key = context.params.key!;
  const progress = context.access.builds.statusOf(key);
  if (!progress) return failure(404, 'bad_request', `no build under key ${key}; POST /asset-library/world-seeds/builds starts one`);
  return buildResponse(context, progress);
}

function buildResponse(context: RouteContext, progress: BuildProgress): ApiResponse {
  const value = progress.state === 'ready' ? context.access.builds.serializedOf(progress.key) : null;
  return json(progress.state === 'ready' || progress.state === 'failed' ? 200 : 202, {
    build: buildJson(progress),
    value,
  });
}

export function buildJson(progress: BuildProgress) {
  return {
    key: progress.key,
    node_type: progress.nodeType,
    state: progress.state,
    fraction: progress.fraction,
    stage: progress.stage,
    elapsed_ms: Math.round(progress.elapsedMs),
    estimated_ms: Math.round(progress.estimatedMs),
    error: progress.error,
  };
}

function paramsOf(def: NodeTypeDef, raw: unknown): Record<string, ParamValue> {
  const params = defaultParams(def);
  if (typeof raw !== 'object' || raw === null) return params;
  for (const [name, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!(name in params)) continue;
    if (typeof value === 'number' && Number.isFinite(value)) params[name] = value;
  }
  return params;
}

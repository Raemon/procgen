import type { CommandParamSpec } from '@/features/app-shell/runtime/commands/command';
import type { ApiRequest, ApiResponse } from './apiMessages';
import type { WorldAccess } from './serverWorld';
import type { SessionStore } from './sessions';

export interface RouteContext {
  sessions: SessionStore;
  access: WorldAccess;
  req: ApiRequest;
  params: Record<string, string>;
}

export interface RouteSpec {
  method: string;
  path: string;
  summary: string;
  body: Record<string, CommandParamSpec>;
  query: Record<string, CommandParamSpec>;
  handle(context: RouteContext): ApiResponse;
}

export interface RouteMatch {
  spec: RouteSpec;
  params: Record<string, string>;
}

const registry: RouteSpec[] = [];

export function registerRoute(spec: RouteSpec): RouteSpec {
  rejectDuplicate(spec);
  rejectUndocumented(spec);
  registry.push(spec);
  return spec;
}

export function allRoutes(): RouteSpec[] {
  return [...registry];
}

export function routeFor(method: string, path: string): RouteMatch | undefined {
  for (const spec of registry) {
    if (spec.method !== method) continue;
    const params = matchPath(spec.path, path);
    if (params) return { spec, params };
  }
  return undefined;
}

export function methodsAllowedFor(path: string): string[] {
  return registry.filter((spec) => matchPath(spec.path, path)).map((spec) => spec.method);
}

function matchPath(pattern: string, path: string): Record<string, string> | null {
  const patternSegments = pattern.split('/');
  const pathSegments = path.split('/');
  if (patternSegments.length !== pathSegments.length) return null;
  const params: Record<string, string> = {};
  for (const [index, segment] of patternSegments.entries()) {
    const actual = pathSegments[index]!;
    if (segment.startsWith('{') && segment.endsWith('}')) {
      if (actual === '') return null;
      params[segment.slice(1, -1)] = actual;
      continue;
    }
    if (segment !== actual) return null;
  }
  return params;
}

function rejectDuplicate(spec: RouteSpec): void {
  if (registry.some((each) => each.method === spec.method && each.path === spec.path)) {
    throw new Error(`route '${spec.method} ${spec.path}' is already registered — paths are the API surface`);
  }
}

function rejectUndocumented(spec: RouteSpec): void {
  if (spec.summary.trim() === '') {
    throw new Error(`route '${spec.method} ${spec.path}' needs a summary — it is rendered into GET /api/v1/openapi.json`);
  }
  for (const [name, param] of Object.entries({ ...spec.body, ...spec.query })) {
    if (param.help.trim() === '') {
      throw new Error(`route '${spec.method} ${spec.path}' param '${name}' needs help text — it is rendered into the docs and the OpenAPI schema`);
    }
  }
}

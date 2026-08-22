import type { CommandParamSpec } from '@/features/app-shell/runtime/commands/command';
import {
  buildApiEndpointCatalog,
  codeSymbols,
  type ApiEndpoint,
} from '@/features/app-shell/documentation/apiEndpointCatalog';
import { everyRegisteredRoute } from '@/features/agents/api/everyRoute';
import type { RouteSpec } from '@/features/agents/api/routeRegistry';
import { agentToolContracts } from './agentToolContracts';

const API_PREFIX = '/api/v1';

export function openApiDocument() {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Procgen API',
      version: '1',
      description: 'The shared interface used by the human editor, autonomous agents, and external clients.',
    },
    servers: [{ url: API_PREFIX }],
    paths: pathsFromCode(),
    'x-agent-tools': {
      god: agentToolContracts('god'),
      character: agentToolContracts('character'),
    },
  };
}

function pathsFromCode(): Record<string, object> {
  const paths: Record<string, Record<string, object>> = {};
  const registeredRoutes = everyRegisteredRoute();
  for (const endpoint of buildApiEndpointCatalog()) {
    if (!endpoint.path.startsWith(API_PREFIX)) continue;
    const path = endpoint.path.slice(API_PREFIX.length) || '/';
    const registered = registeredRoutes.find((route) =>
      route.method === endpoint.method && samePath(route.path, path),
    );
    paths[path] ??= {};
    paths[path]![endpoint.transport === 'websocket' ? 'get' : endpoint.method.toLowerCase()] =
      operation(endpoint, path, registered);
  }
  return paths;
}

function operation(endpoint: ApiEndpoint, path: string, registered: RouteSpec | undefined): object {
  if (endpoint.transport === 'websocket') {
    return {
      summary: summaryFrom(endpoint),
      responses: { '101': { description: 'WebSocket upgrade' } },
      'x-websocket': true,
    };
  }
  const revision = codeSymbols(endpoint.code).includes('expectedRevision');
  return {
    summary: registered?.summary ?? summaryFrom(endpoint),
    operationId: operationId(endpoint.method, path),
    parameters: [
      ...pathParameters(path),
      ...queryParameters(registered),
      ...(revision ? [{ name: 'If-Match', in: 'header', required: true, schema: { type: 'string' } }] : []),
    ],
    ...requestBody(endpoint, registered),
    responses: {
      '200': { description: `Handled by ${endpoint.code.symbol}` },
      ...(revision
        ? {
            '412': { description: 'The If-Match revision is stale' },
            '428': { description: 'If-Match is required' },
          }
        : {}),
    },
  };
}

function summaryFrom(endpoint: ApiEndpoint): string {
  const implementation = firstImplementationSymbol(endpoint.code);
  return `${endpoint.method} handled by ${wordsOf(implementation)}`;
}

function firstImplementationSymbol(step: ApiEndpoint['code']): string {
  const child = step.calls.find((call) => !['route', 'processServices'].includes(call.symbol));
  return child?.symbol ?? step.symbol;
}

function wordsOf(identifier: string): string {
  return identifier
    .replace(/^registered\s+\w+\s+/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .toLowerCase();
}

function operationId(method: string, path: string): string {
  const pathWords = path.replace(/[{}]/g, '').split(/[/-]/).filter(Boolean);
  return [method.toLowerCase(), ...pathWords].join('_');
}

function pathParameters(path: string): object[] {
  return [...path.matchAll(/\{(\w+)\}/g)].map(([, name]) => ({
    name,
    in: 'path',
    required: true,
    schema: { type: 'string' },
  }));
}

function queryParameters(route: RouteSpec | undefined): object[] {
  if (!route) return [];
  return Object.entries(route.query).map(([name, param]) => ({
    name,
    in: 'query',
    required: !param.optional,
    schema: schemaFor(param),
    description: param.help,
  }));
}

function requestBody(endpoint: ApiEndpoint, route: RouteSpec | undefined): object {
  const body = route?.body ?? {};
  const properties = Object.fromEntries(
    Object.entries(body).map(([name, param]) => [name, { ...schemaFor(param), description: param.help }]),
  );
  const needsBody = Object.keys(body).length > 0 || codeSymbols(endpoint.code).includes('writeDocument');
  if (!needsBody) return {};
  return {
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: Object.keys(properties).length === 0
            ? {}
            : {
                type: 'object',
                properties,
                required: Object.entries(body).filter(([, param]) => !param.optional).map(([name]) => name),
                additionalProperties: false,
              },
        },
      },
    },
  };
}

function schemaFor(param: CommandParamSpec): object {
  if (param.kind === 'int' || param.kind === 'nodeId') return { type: 'integer' };
  if (param.kind === 'number') return { type: 'number' };
  if (param.kind === 'json') return {};
  return { type: 'string' };
}

function samePath(left: string, right: string): boolean {
  return left.replace(/\{[^}]+\}/g, '{}') === right.replace(/\{[^}]+\}/g, '{}');
}

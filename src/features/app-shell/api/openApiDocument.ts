import { API_CONTRACTS, type ApiContract } from './apiContracts';
import { agentToolContracts } from './agentToolContracts';

export function openApiDocument() {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Procgen API',
      version: '1',
      description: 'The shared interface used by the human editor, autonomous agents, and external clients.',
    },
    servers: [{ url: '/api/v1' }],
    paths: pathsFromContracts(),
    'x-agent-tools': {
      god: agentToolContracts('god'),
      character: agentToolContracts('character'),
    },
  };
}

function pathsFromContracts(): Record<string, object> {
  const paths: Record<string, Record<string, object>> = {};
  for (const contract of API_CONTRACTS) {
    paths[contract.path] ??= {};
    paths[contract.path]![contract.method.toLowerCase()] = operation(contract);
  }
  paths['/game/socket'] = {
    get: {
      summary: 'upgrade to the real-time Game WebSocket protocol',
      responses: { '101': { description: 'WebSocket upgrade' } },
      'x-websocket': true,
    },
  };
  return paths;
}

function operation(contract: ApiContract): object {
  return {
    summary: contract.summary,
    operationId: operationId(contract),
    parameters: [...pathParameters(contract.path), ...revisionParameter(contract)],
    ...requestBody(contract),
    responses: responses(contract),
  };
}

function operationId(contract: ApiContract): string {
  const pathWords = contract.path.replace(/[{}]/g, '').split(/[/-]/).filter(Boolean);
  return [contract.method.toLowerCase(), ...pathWords].join('_');
}

function pathParameters(path: string): object[] {
  return [...path.matchAll(/\{(\w+)\}/g)].map(([, name]) => ({
    name,
    in: 'path',
    required: true,
    schema: { type: 'string' },
  }));
}

function revisionParameter(contract: ApiContract): object[] {
  if (!contract.requiresRevision) return [];
  return [{ name: 'If-Match', in: 'header', required: true, schema: { type: 'string' } }];
}

function requestBody(contract: ApiContract): object {
  if (!contract.requestBody) return {};
  return {
    requestBody: {
      required: true,
      content: { 'application/json': { schema: contract.requestBody } },
    },
  };
}

function responses(contract: ApiContract): object {
  return {
    '200': { description: contract.summary },
    ...(contract.method === 'POST' ? { '201': { description: contract.summary } } : {}),
    ...(contract.requiresRevision
      ? {
          '412': { description: 'The If-Match revision is stale' },
          '428': { description: 'If-Match is required' },
        }
      : {}),
  };
}

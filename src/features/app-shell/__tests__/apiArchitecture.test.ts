import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { openApiDocument } from '@/features/app-shell/api/openApiDocument';
import {
  buildApiEndpointCatalog,
  codeSymbols,
} from '@/features/app-shell/documentation/apiEndpointCatalog';
import { reportOffenders } from './reportOffenders';

const LEGACY_ROUTES = [
  'src/app/api/persist',
  'src/app/api/perf/server-load',
  'src/app/api/ws',
  'src/app/api/v1/tiles',
  'src/app/api/v1/agents/[id]/act',
];

interface OpenApiShape {
  paths: Record<string, Record<string, unknown>>;
}

export function checkApiArchitecture(check: (name: string, condition: boolean) => void): void {
  const endpoints = buildApiEndpointCatalog();
  const discovered = new Set(endpoints.map(endpointName));
  const undiscovered = nextRouteOperations('src/app/api').filter((operation) => !discovered.has(operation));
  reportOffenders('Route Handler operations the source crawler missed', undiscovered);
  check('every exported Route Handler method is discovered from the source tree', undiscovered.length === 0);

  const document = openApiDocument() as OpenApiShape;
  const undocumented = endpoints
    .filter((endpoint) => endpoint.path.startsWith('/api/v1'))
    .filter((endpoint) => !openApiCovers(endpoint, document));
  reportOffenders('discovered v1 endpoints missing from OpenAPI', undocumented.map(endpointName));
  check('every discovered v1 endpoint reaches OpenAPI', undocumented.length === 0);

  const documentWrite = endpointAt(endpoints, 'PUT', '/api/v1/asset-library/tiles');
  const agentCreate = endpointAt(endpoints, 'POST', '/api/v1/agents');
  const gameSocket = endpointAt(endpoints, 'WS', '/api/v1/game/socket');
  check('a document write expands through revision validation and persistence', includesSymbols(documentWrite, 'persistedDocumentRoute', 'writeDocument', 'expectedRevision'));
  check('an agent endpoint expands through dispatch into its registered behavior', includesSymbols(agentCreate, 'agentRoute', 'handleApiRequest', 'registered POST /agents', 'createAgent'));
  check('the game socket expands from upgrade ownership into message handling', includesSymbols(gameSocket, 'attachWebSocket', 'acceptSocket', 'handleMessage'));
  check('derived consumers distinguish a GET caller from a POST caller on the same path', endpointAt(endpoints, 'GET', '/api/v1/agents').consumers.some((consumer) => consumer.symbol === 'fetchAgents') && agentCreate.consumers.some((consumer) => consumer.symbol === 'createAgent'));

  const documentRead = endpointAt(endpoints, 'GET', '/api/v1/asset-library/tiles');
  const observe = endpointAt(endpoints, 'GET', '/api/v1/agents/{id}/observe');
  check('a registered route publishes its declared body and query inputs', inputText(agentCreate) === 'mode:string:body, name?:string:body, sight_radius_tiles?:int:body, view_size_tiles?:int:body');
  check('path segments become typed inputs alongside declared query knobs', inputText(observe) === 'id:string:path, format?:string:query, sight_radius_tiles?:int:query, view_size_tiles?:int:query');
  check('a registered route publishes the shapes it answers with', outputText(agentCreate) === '201 { agent, urls: object }, 400 { error: string, meaning: string, recovery: string, hint: string }');
  check('a document write publishes its revision header and the document envelope', inputText(documentWrite) === 'If-Match:string:header, body:json:body' && outputText(documentRead).startsWith('200 { data, revision }'));
  check('summaries reach the endpoint signature so a reader knows what an operation is for', agentCreate.signature.summary.startsWith('create an agent'));
  check('a mutation names the types its answer is serialized from', outputTypeText(agentCreate, 201).includes('AgentSession via agentJson') && outputTypeText(endpointAt(endpoints, 'POST', '/api/v1/asset-library/world-seeds/roll'), 202).includes('LabRun via runListJson'));
  check('a document write names the envelope it answers with straight from its satisfies clause', outputTypeText(documentWrite, 200) === 'PersistedDocumentBody, UnparsedDocument, DocumentRevision');
  check('an error answer names its body type through the helper that builds it', outputTypeText(documentWrite, 412).includes('ApiErrorBody via apiError'));

  check('legacy URL adapters were removed instead of hidden behind aliases', LEGACY_ROUTES.every((path) => !existsSync(path)));
  check('Vite and its proxy configuration are gone', !existsSync('vite.config.ts') && !existsSync('index.html'));

  const server = readFileSync('server.ts', 'utf8');
  check('the custom server delegates ordinary HTTP to Next', server.includes('handleNextRequest(request, response)'));
  check('the custom server owns the Game WebSocket attachment', server.includes('attachGameSocket'));
  check('the custom server leaves Next its own upgrades, so dev hot reload survives', server.includes('app.getUpgradeHandler()'));
}

function nextRouteOperations(root: string): string[] {
  return filesUnder(root)
    .filter((path) => path.endsWith('/route.ts'))
    .flatMap((path) => {
      const route = `/api/${path.slice(root.length + 1, -'/route.ts'.length)}`
        .replace(/\[([^\]]+)\]/g, '{$1}');
      const source = readFileSync(path, 'utf8');
      const methods = [...source.matchAll(/export\s+(?:(?:async\s+)?function|const)\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/g)];
      return methods.map((match) => `${match[1]} ${route}`);
    });
}

function endpointAt(
  endpoints: ReturnType<typeof buildApiEndpointCatalog>,
  method: string,
  path: string,
): ReturnType<typeof buildApiEndpointCatalog>[number] {
  const endpoint = endpoints.find((candidate) => candidate.method === method && candidate.path === path);
  if (!endpoint) throw new Error(`missing ${method} ${path}`);
  return endpoint;
}

function includesSymbols(
  endpoint: ReturnType<typeof buildApiEndpointCatalog>[number],
  ...symbols: string[]
): boolean {
  const found = codeSymbols(endpoint.code);
  return symbols.every((symbol) => found.includes(symbol));
}

function inputText(endpoint: ReturnType<typeof buildApiEndpointCatalog>[number]): string {
  return endpoint.signature.inputs
    .map((input) => `${input.name}${input.optional ? '?' : ''}:${input.type}:${input.source}`)
    .join(', ');
}

function outputTypeText(endpoint: ReturnType<typeof buildApiEndpointCatalog>[number], status: number): string {
  return endpoint.signature.outputs
    .filter((output) => output.status === status)
    .flatMap((output) => output.types)
    .map((type) => type.through === '' ? type.name : `${type.name} via ${type.through}`)
    .join(', ');
}

function outputText(endpoint: ReturnType<typeof buildApiEndpointCatalog>[number]): string {
  return endpoint.signature.outputs
    .map((output) => {
      const fields = output.fields.map((field) => field.type === 'unknown' ? field.name : `${field.name}: ${field.type}`);
      return `${output.status} ${fields.length > 0 ? `{ ${fields.join(', ')} }` : output.type}`;
    })
    .join(', ');
}

function openApiCovers(
  endpoint: ReturnType<typeof buildApiEndpointCatalog>[number],
  document: OpenApiShape,
): boolean {
  const path = endpoint.path.slice('/api/v1'.length) || '/';
  const method = endpoint.transport === 'websocket' ? 'get' : endpoint.method.toLowerCase();
  return document.paths[path]?.[method] !== undefined;
}

function endpointName(endpoint: ReturnType<typeof buildApiEndpointCatalog>[number]): string {
  return `${endpoint.method} ${endpoint.path}`;
}

function filesUnder(root: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  });
}

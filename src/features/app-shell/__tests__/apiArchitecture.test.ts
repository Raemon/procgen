import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { openApiDocument } from '@/features/app-shell/api/openApiDocument';
import {
  buildApiEndpointCatalog,
  codeSymbols,
} from '@/features/app-shell/documentation/apiEndpointCatalog';
import { apiMethodColumns, displayApiPath, groupApiEndpoints } from '@/features/app-shell/documentation/apiEndpointGroups';
import { buildApiTypeCatalog, type ApiTypeEntry } from '@/features/app-shell/documentation/apiTypeCatalog';
import { buildApiTypeSections } from '@/features/app-shell/documentation/apiTypeSectionCatalog';
import { RETURNED_SECTION_ID } from '@/features/app-shell/documentation/apiTypeSectionTypes';
import { buildAppRouteCatalog, type AppRouteComponent } from '@/features/app-shell/documentation/appRouteCatalog';
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
  check('a registered route publishes its declared body and query inputs', inputText(agentCreate) === 'mode:string:body, name?:string:body, sight_radius_tiles?:int:body');
  check('path segments become typed inputs alongside declared query knobs', inputText(observe) === 'id:string:path, format?:string:query, sight_radius_tiles?:int:query');
  check('a registered route publishes the shapes it answers with', outputText(agentCreate) === '201 { agent, urls: object }, 400 { error: string, meaning: string, recovery: string, hint: string }');
  check('a document write publishes its revision header and the document envelope', inputText(documentWrite) === 'If-Match:string:header, body:json:body' && outputText(documentRead).startsWith('200 { data, revision }'));
  check('summaries reach the endpoint signature so a reader knows what an operation is for', agentCreate.signature.summary.startsWith('create an agent'));
  check('a mutation names the types its answer is serialized from', outputTypeText(agentCreate, 201).includes('AgentSession via agentJson') && outputTypeText(endpointAt(endpoints, 'POST', '/api/v1/asset-library/world-seeds/roll'), 202).includes('LabRun via runListJson'));
  check('a document write names the envelope it answers with straight from its satisfies clause', outputTypeText(documentWrite, 200) === 'PersistedDocumentBody, UnparsedDocument, DocumentRevision');
  check('an error answer names its body type through the helper that builds it', outputTypeText(documentWrite, 412).includes('ApiErrorBody via apiError'));

  const groups = groupApiEndpoints(endpoints);
  const agents = groupAt(groups, '/api/v1/agents');
  const agent = groupAt(groups, '/api/v1/agents/{id}');
  check('URL groups retain operations at both the collection and item layers', agents.endpoints.some((endpoint) => endpoint.method === 'POST') && agent.endpoints.some((endpoint) => endpoint.method === 'GET'));
  check('URL groups nest item actions below the item layer', groupAt(groups, '/api/v1/agents/{id}/observe').endpoints.some((endpoint) => endpoint.method === 'GET'));
  check('visible URL labels keep hierarchy anchors once and name descendants only by their own segment', displayApiPath('/api/v1') === '/api/v1' && displayApiPath('/api/health') === '/health' && displayApiPath('/api/v1/agents/{id}') === '/{id}' && displayApiPath('/api/v1/agents/{id}/observe') === '/observe');
  check('method columns keep GET first and POST second regardless of which operations a row has', apiMethodColumns(endpoints).slice(0, 2).join(' ') === 'GET POST');

  const types = buildApiTypeCatalog();
  const typeNames = types.map((entry) => entry.name);
  reportOffenders('type names the vocabulary column lists twice from one file', duplicateTypes(types));
  check('every type the codebase declares reaches the vocabulary column exactly once', duplicateTypes(types).length === 0);
  check('the vocabulary column names types the API path never touches too', types.some((entry) => !entry.reachedByApi));
  check('types the API reaches are introduced before the ones it never touches', types.findIndex((entry) => !entry.reachedByApi) > types.map((entry) => entry.reachedByApi).lastIndexOf(true));
  check('a type a route handler needs is introduced ahead of an unrelated editor type', typeAt(types, 'ApiRequest').reachedByApi && typeNames.indexOf('ApiRequest') < typeNames.indexOf('SourceFolder'));
  check('an interface, a type alias, and an enum are all named as vocabulary', new Set(types.map((entry) => entry.kind)).size >= 2 && typeAt(types, 'ApiEndpoint').kind === 'interface');

  const sections = buildApiTypeSections();
  const returned = sections[0]!;
  const sectionTitles = sections.map((section) => section.title);
  check('the vocabulary opens with what POST and PUT endpoints hand back', returned.id === RETURNED_SECTION_ID && returned.entries.some((entry) => entry.name === 'LabRun') && returned.entries.some((entry) => entry.name === 'PersistedDocumentBody'));
  check('a returned type says which mutations return it and through which serializer', returned.entries.find((entry) => entry.name === 'AgentSession')?.returnedBy.some((use) => use.method === 'POST' && use.path === '/api/v1/agents' && use.through === 'agentJson') === true);
  check('types the API answers with outrank the ones only an error answer carries', returned.entries.findIndex((entry) => entry.name === 'ApiErrorBody') > returned.entries.findIndex((entry) => entry.name === 'LabRun'));
  check('sections together list every type exactly once', sections.reduce((total, section) => total + section.entries.length, 0) === types.length && sections.slice(1).every((section) => section.entries.every((entry) => entry.returnedBy.length === 0)));
  check('owning features follow the home-page tree order', sectionTitles.indexOf('app-shell') < sectionTitles.indexOf('asset-library') && sectionTitles.indexOf('asset-library') < sectionTitles.indexOf('agents') && sectionTitles.indexOf('agents') < sectionTitles.indexOf('game'));
  check('a crowded feature splits by folder while a sparse folder stays with its parent', sectionTitles.includes('asset-library / worlds / nodes') && !sectionTitles.some((title) => title.startsWith('game / chat')));

  const routes = buildAppRouteCatalog();
  const home = routeAt(routes, '/');
  const docs = routeAt(routes, '/docs');
  check('every URL a person can open is listed from the page files that serve it', routes.every((route) => route.file.endsWith('page.tsx')) && routes.length >= 2);
  check('a route nests the components it renders, several layers down', componentAt(home.components, 'ProcgenClient') !== null && componentAt(home.components, 'AgentsPanel') !== null);
  check('a nested component publishes the API calls it makes', callText(componentAt(home.components, 'AgentsPanel')!).includes('POST /api/v1/agents'));
  check('a component that calls nothing over the wire lists no calls', componentAt(docs.components, 'ApiEndpointDocumentation')?.calls.length === 0);
  check('the documentation route reports its own OpenAPI link as a call', callText(componentAt(docs.components, 'ApiDocsPage')!).includes('/api/v1/openapi.json'));

  check('legacy URL adapters were removed instead of hidden behind aliases', LEGACY_ROUTES.every((path) => !existsSync(path)));
  check('Vite and its proxy configuration are gone', !existsSync('vite.config.ts') && !existsSync('index.html'));

  const server = readFileSync('server.ts', 'utf8');
  check('the custom server delegates ordinary HTTP to Next', server.includes('handleNextRequest(request, response)'));
  check('the custom server owns the Game WebSocket attachment', server.includes('attachGameSocket'));
  check('the custom server leaves Next its own upgrades, so dev hot reload survives', server.includes('app.getUpgradeHandler()'));
}

function duplicateTypes(types: ApiTypeEntry[]): string[] {
  const seen = new Set<string>();
  return types.filter((entry) => {
    const key = `${entry.file}:${entry.name}`;
    if (seen.has(key)) return true;
    seen.add(key);
    return false;
  }).map((entry) => `${entry.file}:${entry.name}`);
}

function typeAt(types: ApiTypeEntry[], name: string): ApiTypeEntry {
  const entry = types.find((candidate) => candidate.name === name);
  if (!entry) throw new Error(`missing type ${name}`);
  return entry;
}

function routeAt(
  routes: ReturnType<typeof buildAppRouteCatalog>,
  path: string,
): ReturnType<typeof buildAppRouteCatalog>[number] {
  const route = routes.find((candidate) => candidate.path === path);
  if (!route) throw new Error(`missing route ${path}`);
  return route;
}

function componentAt(components: AppRouteComponent[], name: string): AppRouteComponent | null {
  for (const component of components) {
    if (component.name === name) return component;
    const nested = componentAt(component.children, name);
    if (nested) return nested;
  }
  return null;
}

function callText(component: AppRouteComponent): string {
  return component.calls.map((call) => `${call.method} ${call.path}`).join(', ');
}

function groupAt(
  groups: ReturnType<typeof groupApiEndpoints>,
  path: string,
): ReturnType<typeof groupApiEndpoints>[number] {
  const group = groupAtOrNull(groups, path);
  if (!group) throw new Error(`missing URL group ${path}`);
  return group;
}

function groupAtOrNull(
  groups: ReturnType<typeof groupApiEndpoints>,
  path: string,
): ReturnType<typeof groupApiEndpoints>[number] | null {
  for (const group of groups) {
    if (group.path === path) return group;
    const nested = groupAtOrNull(group.children, path);
    if (nested) return nested;
  }
  return null;
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

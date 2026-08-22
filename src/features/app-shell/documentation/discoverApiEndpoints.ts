import { basename, dirname, join, relative, sep } from 'node:path';
import ts from 'typescript';
import { apiCodeTree, attachApiRegistration } from './apiCodeTree';
import { apiPropertyName } from './apiSourceIndex';
import { apiRouteSignature } from './apiRouteSignature';
import type {
  ApiDeclarationRef,
  ApiEndpoint,
  ApiSourceIndex,
  IndexedApiFile,
} from './apiEndpointTypes';

const HTTP_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);

export function discoverApiEndpoints(index: ApiSourceIndex): ApiEndpoint[] {
  const registrations = routeRegistrations(index);
  return [...nextRouteEndpoints(index, registrations), ...webSocketEndpoints(index)];
}

function nextRouteEndpoints(
  index: ApiSourceIndex,
  registrations: ReadonlyMap<string, ApiDeclarationRef>,
): ApiEndpoint[] {
  const apiRoot = join(index.root, 'src', 'app', 'api');
  return [...index.files.values()]
    .filter((file) => file.absolutePath.startsWith(`${apiRoot}${sep}`) && basename(file.path) === 'route.ts')
    .flatMap((file) => endpointsFromRouteFile(file, apiRoot, index, registrations));
}

function endpointsFromRouteFile(
  file: IndexedApiFile,
  apiRoot: string,
  index: ApiSourceIndex,
  registrations: ReadonlyMap<string, ApiDeclarationRef>,
): ApiEndpoint[] {
  const path = routePath(apiRoot, file.absolutePath);
  return exportedHandlers(file).map(({ method, node }) => {
    const handler = { file, node, symbol: method };
    const code = apiCodeTree(handler, index, method);
    const registration = registrations.get(registrationKey(method, path)) ?? null;
    if (registration) attachApiRegistration(code, registration, index);
    return {
      method,
      path,
      transport: 'http' as const,
      code,
      consumers: [],
      signature: apiRouteSignature(handler, registration, index, method, path),
    };
  });
}

function exportedHandlers(file: IndexedApiFile): { method: string; node: ts.Node }[] {
  const handlers: { method: string; node: ts.Node }[] = [];
  for (const statement of file.ast.statements) handlers.push(...handlersFrom(statement));
  return handlers;
}

function handlersFrom(statement: ts.Statement): { method: string; node: ts.Node }[] {
  if (!hasExportModifier(statement)) return [];
  if (ts.isFunctionDeclaration(statement) && statement.name && HTTP_METHODS.has(statement.name.text)) {
    return [{ method: statement.name.text, node: statement }];
  }
  if (!ts.isVariableStatement(statement)) return [];
  return statement.declarationList.declarations.flatMap((declaration) =>
    ts.isIdentifier(declaration.name) && HTTP_METHODS.has(declaration.name.text)
      ? [{ method: declaration.name.text, node: declaration }]
      : [],
  );
}

function webSocketEndpoints(index: ApiSourceIndex): ApiEndpoint[] {
  return [...index.files.values()].flatMap((file) => webSocketsFrom(file, index));
}

function webSocketsFrom(file: IndexedApiFile, index: ApiSourceIndex): ApiEndpoint[] {
  if (!file.source.includes('WebSocketServer') || !file.source.includes(".on('upgrade'")) return [];
  return [...file.declarations]
    .filter((entry): entry is [string, ts.VariableDeclaration] => apiPathVariable(entry[1]))
    .map(([symbol, node]) => {
      const path = (node.initializer as ts.StringLiteral).text;
      const owner = upgradeOwner(file, symbol) ?? { file, node, symbol };
      return {
        method: 'WS',
        path,
        transport: 'websocket' as const,
        code: apiCodeTree(owner, index, 'WS'),
        consumers: [],
        signature: apiRouteSignature(owner, null, index, 'WS', path),
      };
    });
}

function apiPathVariable(node: ts.Node): node is ts.VariableDeclaration {
  return ts.isVariableDeclaration(node) &&
    node.initializer !== undefined &&
    ts.isStringLiteral(node.initializer) &&
    node.initializer.text.startsWith('/api/');
}

function upgradeOwner(file: IndexedApiFile, pathSymbol: string): ApiDeclarationRef | null {
  for (const [symbol, node] of file.declarations) {
    if (!ts.isFunctionDeclaration(node) || !node.body) continue;
    const source = node.getText(file.ast);
    if (source.includes(pathSymbol) && source.includes(".on('upgrade'")) return { file, node, symbol };
  }
  return null;
}

function routeRegistrations(index: ApiSourceIndex): Map<string, ApiDeclarationRef> {
  const registrations = new Map<string, ApiDeclarationRef>();
  for (const file of index.files.values()) collectRouteRegistrations(file, registrations);
  return registrations;
}

function collectRouteRegistrations(
  file: IndexedApiFile,
  registrations: Map<string, ApiDeclarationRef>,
): void {
  visit(file.ast);

  function visit(node: ts.Node): void {
    const registration = registrationFrom(node, file);
    if (registration) registrations.set(registrationKey(registration.method, `/api/v1${registration.path}`), registration.ref);
    ts.forEachChild(node, visit);
  }
}

function registrationFrom(
  node: ts.Node,
  file: IndexedApiFile,
): { method: string; path: string; ref: ApiDeclarationRef } | null {
  if (!ts.isCallExpression(node) || !ts.isIdentifier(node.expression) || node.expression.text !== 'registerRoute') return null;
  const object = node.arguments[0];
  if (!object || !ts.isObjectLiteralExpression(object)) return null;
  const method = stringProperty(object, 'method');
  const path = stringProperty(object, 'path');
  return method && path
    ? { method, path, ref: { file, node: object, symbol: `registered ${method} ${path}` } }
    : null;
}

function stringProperty(object: ts.ObjectLiteralExpression, name: string): string | null {
  const property = object.properties.find((candidate) =>
    ts.isPropertyAssignment(candidate) && apiPropertyName(candidate.name) === name,
  );
  return property && ts.isPropertyAssignment(property) && ts.isStringLiteral(property.initializer)
    ? property.initializer.text
    : null;
}

function routePath(apiRoot: string, routeFile: string): string {
  const directory = relative(apiRoot, dirname(routeFile)).split(sep).join('/');
  const segments = directory === '' ? [] : directory.split('/');
  return `/api/${segments.map(routeSegment).join('/')}`.replace(/\/$/, '');
}

function routeSegment(segment: string): string {
  const catchAll = segment.match(/^\[\[?\.\.\.([^\]]+)\]\]?$/);
  if (catchAll) return `{${catchAll[1]}}`;
  const dynamic = segment.match(/^\[([^\]]+)\]$/);
  return dynamic ? `{${dynamic[1]}}` : segment;
}

function registrationKey(method: string, path: string): string {
  return `${method} ${path.replace(/\{[^}]+\}/g, '{}')}`;
}

function hasExportModifier(node: ts.Node): boolean {
  return ts.canHaveModifiers(node) &&
    (ts.getModifiers(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) ?? false);
}

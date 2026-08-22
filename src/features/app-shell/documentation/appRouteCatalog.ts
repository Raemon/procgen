import { basename, dirname, join, relative, sep } from 'node:path';
import ts from 'typescript';
import { apiLineOf, buildApiSourceIndex, resolveApiDeclaration } from './apiSourceIndex';
import { findApiConsumerCandidates } from './findApiConsumers';
import type { ApiDeclarationRef, ApiSourceIndex, IndexedApiFile } from './apiEndpointTypes';

export interface AppRouteApiCall {
  method: string;
  path: string;
  through: string;
}

export interface AppRouteComponent {
  name: string;
  file: string;
  line: number;
  calls: AppRouteApiCall[];
  children: AppRouteComponent[];
}

export interface AppRoute {
  path: string;
  file: string;
  components: AppRouteComponent[];
}

const MAX_COMPONENT_DEPTH = 6;
const MAX_HELPER_DEPTH = 3;

let defaultRoutes: AppRoute[] | null = null;

export function buildAppRouteCatalog(root: string = process.cwd()): AppRoute[] {
  if (root === process.cwd() && defaultRoutes) return defaultRoutes;
  const index = buildApiSourceIndex(root);
  const calls = callsBySymbol(index);
  const routes = pageFiles(index)
    .map((file) => routeFrom(file, index, calls))
    .filter((route): route is AppRoute => route !== null)
    .sort((left, right) => left.path.localeCompare(right.path));
  if (root === process.cwd()) defaultRoutes = routes;
  return routes;
}

function pageFiles(index: ApiSourceIndex): IndexedApiFile[] {
  const appRoot = join(index.root, 'src', 'app');
  return [...index.files.values()]
    .filter((file) => file.absolutePath.startsWith(`${appRoot}${sep}`) || dirname(file.absolutePath) === appRoot)
    .filter((file) => basename(file.path) === 'page.tsx');
}

function routeFrom(
  file: IndexedApiFile,
  index: ApiSourceIndex,
  calls: Map<string, AppRouteApiCall[]>,
): AppRoute | null {
  const entry = defaultExport(file);
  if (!entry) return null;
  return {
    path: routePath(join(index.root, 'src', 'app'), file.absolutePath),
    file: file.path,
    components: [componentTree(entry, index, calls, 0, new Set())],
  };
}

function componentTree(
  ref: ApiDeclarationRef,
  index: ApiSourceIndex,
  calls: Map<string, AppRouteApiCall[]>,
  depth: number,
  seen: Set<string>,
): AppRouteComponent {
  seen.add(componentIdentity(ref));
  return {
    name: ref.symbol,
    file: ref.file.path,
    line: apiLineOf(ref.file, ref.node),
    calls: componentCalls(ref, index, calls),
    children: depth >= MAX_COMPONENT_DEPTH ? [] : childRefs(ref, index)
      .filter((child) => !seen.has(componentIdentity(child)))
      .map((child) => componentTree(child, index, calls, depth + 1, seen)),
  };
}

function childRefs(ref: ApiDeclarationRef, index: ApiSourceIndex): ApiDeclarationRef[] {
  return [...new Set(renderedNames(ref.node))]
    .map((name) => resolveApiDeclaration(ref.file, name, index))
    .filter((child): child is ApiDeclarationRef => child !== null && child.node !== ref.node);
}

function renderedNames(node: ts.Node): string[] {
  const names: string[] = [];
  visit(node);
  return names;

  function visit(current: ts.Node): void {
    if (ts.isJsxOpeningElement(current) || ts.isJsxSelfClosingElement(current)) {
      const name = current.tagName.getText(current.getSourceFile());
      if (/^[A-Z]/.test(name) && !name.includes('.')) names.push(name);
    }
    ts.forEachChild(current, visit);
  }
}

function componentCalls(
  ref: ApiDeclarationRef,
  index: ApiSourceIndex,
  calls: Map<string, AppRouteApiCall[]>,
): AppRouteApiCall[] {
  const found = new Map<string, AppRouteApiCall>();
  const visited = new Set<string>();
  collect(ref, ref.symbol, 0);
  return [...found.values()];

  function collect(current: ApiDeclarationRef, through: string, depth: number): void {
    const identity = componentIdentity(current);
    if (visited.has(identity)) return;
    visited.add(identity);
    for (const call of calls.get(identity) ?? []) {
      found.set(`${call.method} ${call.path}`, { ...call, through });
    }
    if (depth >= MAX_HELPER_DEPTH) return;
    for (const name of calledNames(current.node)) {
      const helper = resolveApiDeclaration(current.file, name, index);
      if (helper && helper.node !== current.node) collect(helper, depth === 0 ? name : through, depth + 1);
    }
  }
}

function calledNames(node: ts.Node): string[] {
  const names: string[] = [];
  visit(node);
  return [...new Set(names)];

  function visit(current: ts.Node): void {
    if (ts.isCallExpression(current) && ts.isIdentifier(current.expression)) names.push(current.expression.text);
    if (ts.isCallExpression(current) && ts.isPropertyAccessExpression(current.expression) &&
      ts.isIdentifier(current.expression.expression)) names.push(current.expression.expression.text);
    ts.forEachChild(current, visit);
  }
}

function callsBySymbol(index: ApiSourceIndex): Map<string, AppRouteApiCall[]> {
  const calls = new Map<string, AppRouteApiCall[]>();
  for (const candidate of findApiConsumerCandidates(index)) {
    const key = `${candidate.file}:${candidate.symbol}`;
    const held = calls.get(key) ?? [];
    held.push({ method: candidate.method ?? 'GET', path: candidate.path, through: candidate.symbol });
    calls.set(key, held);
  }
  return calls;
}

function componentIdentity(ref: ApiDeclarationRef): string {
  return `${ref.file.path}:${ref.symbol}`;
}

function defaultExport(file: IndexedApiFile): ApiDeclarationRef | null {
  for (const statement of file.ast.statements) {
    if (!isDefaultExport(statement)) continue;
    if (ts.isFunctionDeclaration(statement) && statement.name) {
      return { file, node: statement, symbol: statement.name.text };
    }
  }
  return null;
}

function isDefaultExport(statement: ts.Statement): boolean {
  return ts.canHaveModifiers(statement) &&
    (ts.getModifiers(statement)?.some((modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword) ?? false);
}

function routePath(appRoot: string, pageFile: string): string {
  const directory = relative(appRoot, dirname(pageFile)).split(sep).join('/');
  const segments = directory === '' ? [] : directory.split('/').filter((segment) => !segment.startsWith('('));
  return `/${segments.map(routeSegment).join('/')}`.replace(/(.)\/$/, '$1');
}

function routeSegment(segment: string): string {
  const dynamic = segment.match(/^\[\[?\.?\.?\.?([^\]]+)\]\]?$/);
  return dynamic ? `{${dynamic[1]}}` : segment;
}

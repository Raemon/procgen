import { dirname, extname, join, resolve } from 'node:path';
import ts from 'typescript';
import { catalogSourceFiles } from './sourceCatalog';
import type {
  ApiDeclarationRef,
  ApiImportRef,
  ApiSourceIndex,
  IndexedApiFile,
} from './apiEndpointTypes';

const JAVASCRIPT_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];

let defaultIndex: ApiSourceIndex | null = null;

export function buildApiSourceIndex(root: string): ApiSourceIndex {
  if (root === process.cwd() && defaultIndex) return defaultIndex;
  const files = new Map<string, IndexedApiFile>();
  for (const file of catalogSourceFiles(root)) {
    if (!JAVASCRIPT_EXTENSIONS.includes(extname(file.path))) continue;
    const ast = ts.createSourceFile(file.path, file.source, ts.ScriptTarget.Latest, true, scriptKind(file.path));
    files.set(file.absolutePath, {
      ...file,
      ast,
      declarations: declarationsIn(ast),
      imports: importsIn(ast),
    });
  }
  const index = { root: resolve(root), files };
  if (root === process.cwd()) defaultIndex = index;
  return index;
}

export function resolveApiDeclaration(
  file: IndexedApiFile,
  name: string,
  index: ApiSourceIndex,
): ApiDeclarationRef | null {
  const local = file.declarations.get(name);
  if (local) return { file, node: local, symbol: name };
  const imported = file.imports.get(name);
  if (!imported) return null;
  const importedFile = resolveApiModuleFile(file, imported.module, index);
  if (!importedFile) return null;
  const declaration = importedFile.declarations.get(imported.imported);
  return declaration ? { file: importedFile, node: declaration, symbol: imported.imported } : null;
}

export function apiLineOf(file: IndexedApiFile, node: ts.Node): number {
  return file.ast.getLineAndCharacterOfPosition(node.getStart(file.ast)).line + 1;
}

export function apiExcerptOf(file: IndexedApiFile, node: ts.Node, maxLines: number = 5): string {
  const start = apiLineOf(file, node) - 1;
  const lines = file.source.split(/\r?\n/).slice(start, start + maxLines);
  const content = lines.filter((line) => line.trim() !== '');
  const indent = content.length === 0 ? 0 : Math.min(...content.map((line) => line.match(/^\s*/)![0].length));
  return lines.map((line) => line.slice(indent).trimEnd()).join('\n');
}

export function apiPropertyName(name: ts.PropertyName): string | null {
  return ts.isIdentifier(name) || ts.isStringLiteral(name) ? name.text : null;
}

function declarationsIn(ast: ts.SourceFile): Map<string, ts.Node> {
  const declarations = new Map<string, ts.Node>();
  visit(ast);
  return declarations;

  function visit(node: ts.Node): void {
    if (ts.isFunctionDeclaration(node) && node.name) remember(node.name.text, node);
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) remember(node.name.text, node);
    ts.forEachChild(node, visit);
  }

  function remember(name: string, node: ts.Node): void {
    const held = declarations.get(name);
    if (!held || isTopLevel(node)) declarations.set(name, node);
  }
}

function importsIn(ast: ts.SourceFile): Map<string, ApiImportRef> {
  const imports = new Map<string, ApiImportRef>();
  for (const statement of ast.statements) addImportsFrom(statement, imports);
  return imports;
}

function addImportsFrom(statement: ts.Statement, imports: Map<string, ApiImportRef>): void {
  if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) return;
  const clause = statement.importClause;
  if (!clause) return;
  const module = statement.moduleSpecifier.text;
  if (clause.name) imports.set(clause.name.text, { imported: 'default', module });
  const bindings = clause.namedBindings;
  if (!bindings || !ts.isNamedImports(bindings)) return;
  for (const element of bindings.elements) {
    imports.set(element.name.text, { imported: element.propertyName?.text ?? element.name.text, module });
  }
}

export function resolveApiModuleFile(file: IndexedApiFile, module: string, index: ApiSourceIndex): IndexedApiFile | null {
  const base = module.startsWith('@/')
    ? join(index.root, 'src', module.slice(2))
    : module.startsWith('.')
      ? resolve(dirname(file.absolutePath), module)
      : null;
  if (!base) return null;
  for (const candidate of moduleCandidates(base)) {
    const found = index.files.get(candidate);
    if (found) return found;
  }
  return null;
}

function moduleCandidates(base: string): string[] {
  if (JAVASCRIPT_EXTENSIONS.includes(extname(base))) return [base];
  return [
    ...JAVASCRIPT_EXTENSIONS.map((extension) => `${base}${extension}`),
    ...JAVASCRIPT_EXTENSIONS.map((extension) => join(base, `index${extension}`)),
  ];
}

function isTopLevel(node: ts.Node): boolean {
  return ts.isSourceFile(node.parent) ||
    (ts.isVariableDeclaration(node) && ts.isVariableStatement(node.parent.parent));
}

function scriptKind(path: string): ts.ScriptKind {
  if (path.endsWith('.tsx')) return ts.ScriptKind.TSX;
  if (path.endsWith('.jsx')) return ts.ScriptKind.JSX;
  if (/\.(?:js|mjs|cjs)$/.test(path)) return ts.ScriptKind.JS;
  return ts.ScriptKind.TS;
}

import type { SourceDeclaration, SourceFile, SourceFolder } from './sourceTreeTypes';

interface TreeItemBase {
  id: string;
  name: string;
  depth: number;
  parentId: string | null;
  expandable: boolean;
  expanded: boolean;
}

export interface FolderTreeItem extends TreeItemBase {
  kind: 'folder';
  folder: SourceFolder;
}

export interface FileTreeItem extends TreeItemBase {
  kind: 'file';
  file: SourceFile;
}

export interface DeclarationTreeItem extends TreeItemBase {
  kind: 'declaration';
  declaration: SourceDeclaration;
  file: SourceFile;
}

export type SourceTreeItem = FolderTreeItem | FileTreeItem | DeclarationTreeItem;

export type TreeKeyAction =
  | { kind: 'focus'; id: string }
  | { kind: 'expand'; id: string }
  | { kind: 'collapse'; id: string }
  | { kind: 'none' };

export function folderTreeId(path: string): string {
  return `folder:${path}`;
}

export function fileTreeId(path: string): string {
  return `file:${path}`;
}

export function declarationTreeId(file: SourceFile, declaration: SourceDeclaration): string {
  return `declaration:${file.path}:${declaration.kind}:${declaration.line}:${declaration.name}`;
}

export function defaultSourceFile(root: SourceFolder): SourceFile | null {
  return fileAtPath(root, 'src/app/docs/page.tsx') ?? firstFileIn(root);
}

export function expansionIdsForFile(root: SourceFolder, path: string): Set<string> {
  const ids = new Set<string>();
  if (!collectExpansionIds(root, path, ids)) ids.clear();
  return ids;
}

export function sourceCounts(root: SourceFolder): { files: number; declarations: number } {
  let files = 0;
  let declarations = 0;
  visitFiles(root, (file) => {
    files += 1;
    declarations += file.declarations.length;
  });
  return { files, declarations };
}

export function visibleSourceItems(
  root: SourceFolder,
  expandedIds: ReadonlySet<string>,
  filter: string,
): SourceTreeItem[] {
  const query = filter.trim().toLocaleLowerCase();
  if (query) return filteredSourceItems(root, query);
  const items: SourceTreeItem[] = [];
  appendFolder(root, null, 0, expandedIds, items);
  return items;
}

export function treeKeyAction(
  items: readonly SourceTreeItem[],
  focusedId: string,
  key: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight' | 'Home' | 'End',
): TreeKeyAction {
  if (items.length === 0) return { kind: 'none' };
  const index = Math.max(0, items.findIndex((item) => item.id === focusedId));
  const current = items[index]!;
  if (key === 'Home') return { kind: 'focus', id: items[0]!.id };
  if (key === 'End') return { kind: 'focus', id: items[items.length - 1]!.id };
  if (key === 'ArrowUp') return { kind: 'focus', id: items[Math.max(0, index - 1)]!.id };
  if (key === 'ArrowDown') return { kind: 'focus', id: items[Math.min(items.length - 1, index + 1)]!.id };
  if (key === 'ArrowRight') {
    if (current.expandable && !current.expanded) return { kind: 'expand', id: current.id };
    const child = items[index + 1];
    if (child?.parentId === current.id) return { kind: 'focus', id: child.id };
    return { kind: 'none' };
  }
  if (current.expandable && current.expanded) return { kind: 'collapse', id: current.id };
  return current.parentId ? { kind: 'focus', id: current.parentId } : { kind: 'none' };
}

function appendFolder(
  folder: SourceFolder,
  parentId: string | null,
  depth: number,
  expandedIds: ReadonlySet<string>,
  items: SourceTreeItem[],
): void {
  const id = folderTreeId(folder.path);
  const expanded = expandedIds.has(id);
  items.push({ kind: 'folder', id, name: folder.name, depth, parentId, expandable: folder.children.length > 0, expanded, folder });
  if (!expanded) return;
  for (const child of folder.children) {
    if (child.kind === 'folder') appendFolder(child, id, depth + 1, expandedIds, items);
    else appendFile(child, id, depth + 1, expandedIds, items);
  }
}

function appendFile(
  file: SourceFile,
  parentId: string,
  depth: number,
  expandedIds: ReadonlySet<string>,
  items: SourceTreeItem[],
): void {
  const id = fileTreeId(file.path);
  const expanded = expandedIds.has(id);
  items.push({ kind: 'file', id, name: file.name, depth, parentId, expandable: file.declarations.length > 0, expanded, file });
  if (!expanded) return;
  for (const declaration of file.declarations) {
    items.push({
      kind: 'declaration',
      id: declarationTreeId(file, declaration),
      name: declaration.name,
      depth: depth + 1,
      parentId: id,
      expandable: false,
      expanded: false,
      declaration,
      file,
    });
  }
}

function filteredSourceItems(root: SourceFolder, query: string): SourceTreeItem[] {
  const filtered = filteredFolder(root, query);
  if (!filtered) return [];
  const items: SourceTreeItem[] = [];
  appendFilteredFolder(filtered, null, 0, items);
  return items;
}

interface FilteredFolder {
  folder: SourceFolder;
  children: Array<FilteredFolder | FilteredFile>;
}

interface FilteredFile {
  file: SourceFile;
  declarations: SourceDeclaration[];
}

function filteredFolder(folder: SourceFolder, query: string): FilteredFolder | null {
  const children: Array<FilteredFolder | FilteredFile> = [];
  for (const child of folder.children) {
    if (child.kind === 'folder') {
      const match = filteredFolder(child, query);
      if (match) children.push(match);
      continue;
    }
    const declarations = child.declarations.filter((declaration) => declaration.name.toLocaleLowerCase().includes(query));
    const fileMatches = child.name.toLocaleLowerCase().includes(query) || child.path.toLocaleLowerCase().includes(query);
    if (fileMatches || declarations.length > 0) children.push({ file: child, declarations });
  }
  return children.length > 0 ? { folder, children } : null;
}

function appendFilteredFolder(
  filtered: FilteredFolder,
  parentId: string | null,
  depth: number,
  items: SourceTreeItem[],
): void {
  const id = folderTreeId(filtered.folder.path);
  items.push({
    kind: 'folder',
    id,
    name: filtered.folder.name,
    depth,
    parentId,
    expandable: true,
    expanded: true,
    folder: filtered.folder,
  });
  for (const child of filtered.children) {
    if ('folder' in child) appendFilteredFolder(child, id, depth + 1, items);
    else appendFilteredFile(child, id, depth + 1, items);
  }
}

function appendFilteredFile(filtered: FilteredFile, parentId: string, depth: number, items: SourceTreeItem[]): void {
  const { file, declarations } = filtered;
  const id = fileTreeId(file.path);
  items.push({
    kind: 'file',
    id,
    name: file.name,
    depth,
    parentId,
    expandable: declarations.length > 0,
    expanded: declarations.length > 0,
    file,
  });
  for (const declaration of declarations) {
    items.push({
      kind: 'declaration',
      id: declarationTreeId(file, declaration),
      name: declaration.name,
      depth: depth + 1,
      parentId: id,
      expandable: false,
      expanded: false,
      declaration,
      file,
    });
  }
}

function collectExpansionIds(folder: SourceFolder, path: string, ids: Set<string>): boolean {
  for (const child of folder.children) {
    if (child.kind === 'file' && child.path === path) {
      ids.add(folderTreeId(folder.path));
      ids.add(fileTreeId(child.path));
      return true;
    }
    if (child.kind === 'folder' && collectExpansionIds(child, path, ids)) {
      ids.add(folderTreeId(folder.path));
      return true;
    }
  }
  return false;
}

function fileAtPath(folder: SourceFolder, path: string): SourceFile | null {
  for (const child of folder.children) {
    if (child.kind === 'file' && child.path === path) return child;
    if (child.kind === 'folder') {
      const match = fileAtPath(child, path);
      if (match) return match;
    }
  }
  return null;
}

function firstFileIn(folder: SourceFolder): SourceFile | null {
  for (const child of folder.children) {
    if (child.kind === 'file') return child;
    const nested = firstFileIn(child);
    if (nested) return nested;
  }
  return null;
}

function visitFiles(folder: SourceFolder, visit: (file: SourceFile) => void): void {
  for (const child of folder.children) {
    if (child.kind === 'file') visit(child);
    else visitFiles(child, visit);
  }
}

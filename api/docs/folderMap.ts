import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const EXPORT_PATTERN =
  /^export (?:async )?(?:function|class|const|interface|type|enum) (\w+)/;

export interface FolderEntry {
  path: string;
  files: FileEntry[];
}

export interface FileEntry {
  path: string;
  name: string;
  exports: string[];
}

export const TOP_LEVEL_FOLDERS = [
  { name: 'library', role: 'the library and detail panels: folders of everything a world is made of, and the editor for whatever is selected' },
  { name: 'assets', role: 'every asset a world is assembled from, and the editors that shape them' },
  { name: 'procgen', role: 'the node pipeline that generates the world' },
  { name: 'agents', role: 'the agents panel: what an agent perceives and how a run is driven' },
  { name: 'world', role: 'the world view: how the world is rendered, walked and simulated' },
  { name: 'abilities', role: 'every ability, shared by the panels and the api' },
  { name: 'api', role: 'every endpoint, and the documents rendered from the registries' },
  { name: 'multiplayer', role: 'both halves of the wire between browser and host' },
  { name: 'server', role: 'the process that hosts the game, the api and the built client' },
  { name: 'frontend', role: 'the app frame the panels mount into, and the controls they share' },
  { name: 'perf', role: 'the probes behind the fps badge: frame, work, browser and server load' },
  { name: 'checks', role: 'the executable specification run by npm run check' },
  { name: 'tools', role: 'generators, previews, benchmarks and world rolls' },
] as const;

export function folderMap(root: string): FolderEntry[] {
  const folders: FolderEntry[] = [];
  collectFolders(root, folders);
  return folders.filter((folder) => folder.files.length > 0);
}

function collectFolders(path: string, into: FolderEntry[]): void {
  const entries = readdirSync(path).sort();
  const files = entries
    .filter((entry) => isSourceFile(join(path, entry)))
    .map((entry) => fileEntry(join(path, entry)));
  into.push({ path, files });
  for (const entry of entries) {
    const child = join(path, entry);
    if (statSync(child).isDirectory()) collectFolders(child, into);
  }
}

function isSourceFile(path: string): boolean {
  return statSync(path).isFile() && (path.endsWith('.ts') || path.endsWith('.tsx'));
}

function fileEntry(path: string): FileEntry {
  return {
    path,
    name: path.split('/').pop()!,
    exports: exportedNames(readFileSync(path, 'utf8')),
  };
}

function exportedNames(source: string): string[] {
  const names: string[] = [];
  for (const line of source.split('\n')) {
    const match = line.match(EXPORT_PATTERN);
    if (match) names.push(match[1]!);
  }
  return names;
}

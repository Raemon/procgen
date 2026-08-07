import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SOURCE_ROOTS = [
  'abilities',
  'agents',
  'api',
  'frontend',
  'library',
  'multiplayer',
  'procgen',
  'server',
  'world',
];

const PANEL_AND_CHROME_ROOTS = ['agents', 'frontend', 'library', 'procgen', 'world'];

const MUTABLE_LIBRARIES = [
  'PipelineStore',
  'Tileset',
  'PrefabLibrary',
  'CreatureLibrary',
  'ItemLibrary',
  'TemplateLibrary',
  'WorldPresetLibrary',
  'World',
];

const MAY_HOLD_A_MUTABLE_LIBRARY = [
  'abilities/',
  'api/',
  'library/',
  'procgen/',
  'world/',
  'frontend/appRuntime.ts',
  'frontend/readOnlyLibraries.ts',
];

export function checkOnlyTheAbilityLayerCanMutate(
  check: (name: string, condition: boolean) => void,
): void {
  const offenders = SOURCE_ROOTS.flatMap(sourceFiles).filter(importsAMutableLibrary);
  if (offenders.length > 0) {
    console.log(`     files holding a mutable library outside the ability layer:\n       ${offenders.join('\n       ')}`);
  }
  check(
    'only the ability layer and the runtime can hold a mutable library',
    offenders.length === 0,
  );
  check(
    'the ability registry is what the panels call',
    PANEL_AND_CHROME_ROOTS.flatMap(sourceFiles).every(
      (path) => !readFileSync(path, 'utf8').includes('runtime.store.set'),
    ),
  );
}

function sourceFiles(root: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(root)) {
    const path = join(root, entry);
    if (statSync(path).isDirectory()) found.push(...sourceFiles(path));
    else if (path.endsWith('.ts') || path.endsWith('.tsx')) found.push(path);
  }
  return found;
}

function importsAMutableLibrary(path: string): boolean {
  if (MAY_HOLD_A_MUTABLE_LIBRARY.some((allowed) => path.startsWith(allowed))) return false;
  const source = readFileSync(path, 'utf8');
  return valueImportedNames(source).some((name) => MUTABLE_LIBRARIES.includes(name));
}

function valueImportedNames(source: string): string[] {
  const names: string[] = [];
  for (const line of source.split('\n')) {
    const match = line.match(/^import \{([^}]*)\} from/);
    if (!match) continue;
    for (const specifier of match[1]!.split(',')) {
      const trimmed = specifier.trim();
      if (trimmed !== '' && !trimmed.startsWith('type ')) names.push(trimmed.split(' ')[0]!);
    }
  }
  return names;
}

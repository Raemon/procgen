import { readFileSync } from 'node:fs';
import { endingIn, filesUnder } from './filesUnder';
import { reportOffenders } from './reportOffenders';

const ENGINE_ROOTS = ['src/features', 'src/infrastructure', 'src/app'];
const ENGINE_DOORS_INTO_WORLDS = [
  'src/features/asset-library/worlds/nodes/index.ts',
  'src/infrastructure/server/procgenServices.ts',
];
const WORLDS_ROOT = 'src/worlds';

export function checkWorldsStayApart(check: (name: string, condition: boolean) => void): void {
  const engineFiles = ENGINE_ROOTS.flatMap((root) => filesUnder(root, endingIn('.ts', '.tsx')));
  const engineReachingIn = engineFiles
    .filter((path) => !isTest(path) && !ENGINE_DOORS_INTO_WORLDS.includes(path))
    .filter((path) => importsFrom(path, /^@\/worlds\//));
  reportOffenders('engine files importing a world', engineReachingIn);
  check(
    'the engine imports worlds only through the two registries, so no world leaks into engine code',
    engineReachingIn.length === 0,
  );

  const worldFiles = filesUnder(WORLDS_ROOT, endingIn('.ts', '.tsx')).filter((path) => !isTest(path));
  const crossing = worldFiles.filter((path) => {
    const own = worldOf(path);
    return own !== null && importsFrom(path, /^@\/worlds\/([^/]+)/, (world) => world !== own);
  });
  reportOffenders('worlds importing one another', crossing);
  check('no world imports another world, so each can be deleted on its own', crossing.length === 0);

  const registries = ['client', 'server'].map((name) => `${WORLDS_ROOT}/${name}.ts`);
  check(
    'the worlds root keeps one client registry and one server registry',
    registries.every((path) => worldFiles.includes(path)),
  );
}

function worldOf(path: string): string | null {
  const match = path.match(/^src\/worlds\/([^/]+)\//);
  return match ? match[1]! : null;
}

function importsFrom(
  path: string,
  pattern: RegExp,
  accept: (captured: string) => boolean = () => true,
): boolean {
  const source = readFileSync(path, 'utf8');
  for (const match of source.matchAll(/from\s+'([^']+)'|import\s+'([^']+)'/g)) {
    const specifier = match[1] ?? match[2] ?? '';
    const hit = specifier.match(pattern);
    if (hit && accept(hit[1] ?? '')) return true;
  }
  return false;
}

function isTest(path: string): boolean {
  return path.includes('/__tests__/');
}

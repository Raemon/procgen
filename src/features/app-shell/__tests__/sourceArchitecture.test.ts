import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { reportOffenders } from './reportOffenders';

const SOURCE_ROOTS = ['app', 'features', 'infrastructure'];
const FEATURE_ROOTS = ['app-shell', 'asset-library', 'agents', 'game'];
const FORBIDDEN_CATCH_ALLS = ['components', 'lib', 'abilities', 'commands', 'assets', 'common', 'misc'];

export function checkSourceArchitecture(check: (name: string, condition: boolean) => void): void {
  const sourceRoots = readdirSync('src', { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  check('src has exactly the three documented source roots', sameMembers(sourceRoots, SOURCE_ROOTS));

  const featureRoots = readdirSync('src/features', { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  check('features match the four rendered home-page regions', sameMembers(featureRoots, FEATURE_ROOTS));

  const forbidden = FORBIDDEN_CATCH_ALLS.filter((name) => existsSync(join('src/features', name)));
  reportOffenders('catch-all feature roots', forbidden);
  check('no generic catch-all feature folder can become a second organization system', forbidden.length === 0);

  const shell = readFileSync('src/features/app-shell/ProcgenApp.tsx', 'utf8');
  check('the React root composes Asset Library, Agents, then Game', appearsInOrder(shell, ['<AssetLibrary', '<Agents', '<Game']));

  const library = readFileSync('src/features/asset-library/AssetLibrary.tsx', 'utf8');
  check('Detail is rendered by Asset Library rather than beside it in App Shell', library.includes('<LibraryPanel') && library.includes('<DetailPanel'));

  const agents = readFileSync('src/features/agents/Agents.tsx', 'utf8');
  check('Agent Log is rendered by Agents rather than beside it in App Shell', agents.includes('<AgentsPanel') && agents.includes('<AgentLogPanel'));

  const game = readFileSync('src/features/game/Game.tsx', 'utf8');
  check('Worlds is rendered by Game rather than beside it in App Shell', game.includes('<WorldsPanel') && game.includes('<GamePanel'));

  const productFilesInApp = filesUnder('src/app').filter((path) => /\.(?:ts|tsx)$/.test(path)).filter(
    (path) => !/(?:^|\/)(?:layout|page|route)\.tsx?$/.test(path),
  );
  reportOffenders('product modules under the Next router', productFilesInApp);
  check('src/app contains only Next pages, layouts, and route adapters', productFilesInApp.length === 0);
}

function filesUnder(root: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  });
}

function sameMembers(actual: readonly string[], expected: readonly string[]): boolean {
  return [...actual].sort().join() === [...expected].sort().join();
}

function appearsInOrder(source: string, needles: readonly string[]): boolean {
  let cursor = -1;
  for (const needle of needles) {
    cursor = source.indexOf(needle, cursor + 1);
    if (cursor < 0) return false;
  }
  return true;
}

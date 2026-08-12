import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { API_CONTRACTS } from '@/features/app-shell/api/apiContracts';
import { reportOffenders } from './reportOffenders';

const LEGACY_ROUTES = [
  'src/app/api/persist',
  'src/app/api/perf/server-load',
  'src/app/api/ws',
  'src/app/api/v1/tiles',
  'src/app/api/v1/agents/[id]/act',
];

export function checkApiArchitecture(check: (name: string, condition: boolean) => void): void {
  const routePaths = nextRoutePaths('src/app/api');
  const undocumented = routePaths.filter(
    (path) => !['/health', '/v1/openapi.json'].includes(path) && !contractCovers(path),
  );
  reportOffenders('Next routes missing from feature-owned API contracts', undocumented);
  check('every public Route Handler is covered by a feature-owned contract', undocumented.length === 0);

  const missingAdapters = API_CONTRACTS.filter((contract) => !routePaths.includes(`/v1${nextPath(contract.path)}`));
  reportOffenders('API contracts without a Next route adapter', missingAdapters.map((contract) => `${contract.method} ${contract.path}`));
  check('every HTTP contract has a Next route adapter', missingAdapters.length === 0);

  check('legacy URL adapters were removed instead of hidden behind aliases', LEGACY_ROUTES.every((path) => !existsSync(path)));
  check('Vite and its proxy configuration are gone', !existsSync('vite.config.ts') && !existsSync('index.html'));

  const server = readFileSync('server.ts', 'utf8');
  check('the custom server delegates ordinary HTTP to Next', server.includes('handleNextRequest(request, response)'));
  check('the custom server owns the Game WebSocket attachment', server.includes('attachGameSocket'));
  check('the custom server leaves Next its own upgrades, so dev hot reload survives', server.includes('app.getUpgradeHandler()'));
}

function nextRoutePaths(root: string): string[] {
  return filesUnder(root)
    .filter((path) => path.endsWith('/route.ts'))
    .map((path) => `/${path.slice(root.length + 1, -'/route.ts'.length)}`);
}

function contractCovers(nextPathname: string): boolean {
  if (nextPathname === '/v1/game/socket') return true;
  return API_CONTRACTS.some((contract) => `/v1${nextPath(contract.path)}` === nextPathname);
}

function nextPath(contractPath: string): string {
  return contractPath.replace(/\{([^}]+)\}/g, '[$1]');
}

function filesUnder(root: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  });
}

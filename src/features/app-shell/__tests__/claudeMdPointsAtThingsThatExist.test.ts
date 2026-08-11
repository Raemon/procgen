import { existsSync, readFileSync } from 'node:fs';
import { reportOffenders } from './reportOffenders';
import { API_CONTRACTS } from '@/features/app-shell/api/apiContracts';

const CLAUDE_MD = 'claude.md';
const API_PREFIX = '/api/v1';
const FILE_PATH = /\b[\w.-]+\/[\w./-]+\.(?:tsx?|json|css|sh)\b/g;
const NPM_SCRIPT = /\bnpm run ([\w:]+)/g;
const HTTP_ROUTE = /\b(?:GET|POST|PUT|DELETE) (\/[\w./{}-]*)/g;

export function checkClaudeMdPointsAtThingsThatExist(
  check: (name: string, condition: boolean) => void,
): void {
  const house = readFileSync(CLAUDE_MD, 'utf8');

  const missingFiles = matchesOf(house, FILE_PATH)
    .filter((path) => !path.startsWith('api/'))
    .filter((path) => !existsSync(path));
  reportOffenders('paths claude.md names that do not exist', missingFiles);
  check(
    'every file claude.md points at exists, so the one hand-written file cannot misdirect',
    missingFiles.length === 0,
  );

  const missingScripts = capturesOf(house, NPM_SCRIPT).filter((name) => !npmScripts().includes(name));
  reportOffenders('npm scripts claude.md names that are not defined', missingScripts);
  check(
    'every npm script claude.md names is defined in package.json',
    missingScripts.length === 0,
  );

  const missingRoutes = capturesOf(house, HTTP_ROUTE).filter((path) => !isServed(path));
  reportOffenders('routes claude.md names that nothing serves', missingRoutes);
  check(
    'every url claude.md names is a route this server actually mounts',
    missingRoutes.length === 0,
  );
}

function isServed(path: string): boolean {
  if (['/api/health', '/api/v1/openapi.json', '/api/v1/game/socket', '/docs'].includes(path)) {
    return true;
  }
  if (!path.startsWith(API_PREFIX)) return false;
  const withinApi = path.slice(API_PREFIX.length);
  return API_CONTRACTS.some((contract) => contract.path === withinApi);
}

function npmScripts(): string[] {
  const manifest = JSON.parse(readFileSync('package.json', 'utf8')) as {
    scripts: Record<string, string>;
  };
  return Object.keys(manifest.scripts);
}

function matchesOf(source: string, pattern: RegExp): string[] {
  return [...new Set(source.match(pattern) ?? [])];
}

function capturesOf(source: string, pattern: RegExp): string[] {
  return [...new Set([...source.matchAll(pattern)].map((match) => match[1]!))];
}

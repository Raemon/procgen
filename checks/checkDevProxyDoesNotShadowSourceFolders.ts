import { readFileSync } from 'node:fs';
import { SERVER_LOAD_PATH } from '../perf/serverLoadContract';
import { endingIn, filesUnder } from './filesUnder';
import { reportOffenders } from './reportOffenders';

const VITE_CONFIG = 'vite.config.ts';
const PROXY_BLOCK = /proxy:\s*\{([\s\S]*?)\n {4}\}/;
const PROXY_KEY = /['"](\/[\w./-]*)['"]\s*:/g;
const EXPECTED_PROXY_PREFIXES = ['/ws', '/api/v1', '/docs', SERVER_LOAD_PATH, '/persist'];

export function checkDevProxyDoesNotShadowSourceFolders(
  check: (name: string, condition: boolean) => void,
): void {
  const prefixes = proxiedPrefixes();
  check(
    'the dev proxy still names exactly the prefixes this check expects, so a rewrite cannot hide one from it',
    sameSet(prefixes, EXPECTED_PROXY_PREFIXES),
  );
  check(
    'the dev proxy forwards the server-load path the contract declares, so the readout cannot drift from its route',
    prefixes.includes(SERVER_LOAD_PATH),
  );

  const shadowed = prefixes.filter((prefix) => modulesShadowedBy(prefix).length > 0);
  reportOffenders('proxy prefixes that swallow modules vite must serve itself', shadowed);
  check(
    'no dev proxy prefix shadows a module the browser imports, so folders sharing a route prefix still load',
    shadowed.length === 0,
  );
}

function proxiedPrefixes(): string[] {
  const block = PROXY_BLOCK.exec(readFileSync(VITE_CONFIG, 'utf8'));
  if (!block) return [];
  return [...block[1]!.matchAll(PROXY_KEY)].map((match) => match[1]!);
}

function modulesShadowedBy(prefix: string): string[] {
  const path = prefix.slice(1);
  const root = path.split('/')[0]!;
  return filesUnder(root, endingIn('.ts', '.tsx', '.css')).filter(
    (file) => file === path || file.startsWith(`${path}/`),
  );
}

function sameSet(actual: readonly string[], expected: readonly string[]): boolean {
  return (
    actual.length === expected.length && [...actual].sort().join() === [...expected].sort().join()
  );
}

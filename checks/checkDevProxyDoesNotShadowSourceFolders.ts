import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const VITE_CONFIG = 'vite.config.ts';
const PROXY_PREFIX = /^\s*'(\/[\w./-]*)':\s*\{/gm;

export function checkDevProxyDoesNotShadowSourceFolders(
  check: (name: string, condition: boolean) => void,
): void {
  const prefixes = proxiedPrefixes();
  check(
    'the dev config still declares proxy prefixes this check can read, so it cannot pass by finding none',
    prefixes.length >= 4,
  );

  const shadowed = prefixes.filter((prefix) => modulesUnder(prefix).length > 0);
  report('proxy prefixes that swallow source modules vite must serve', shadowed);
  check(
    'no dev proxy prefix shadows a source module, so every folder sharing a route prefix still loads',
    shadowed.length === 0,
  );
}

function proxiedPrefixes(): string[] {
  const config = readFileSync(VITE_CONFIG, 'utf8');
  return [...config.matchAll(PROXY_PREFIX)].map((match) => match[1]!.slice(1)).filter(Boolean);
}

function modulesUnder(prefix: string): string[] {
  const root = prefix.split('/')[0]!;
  if (!existsAsDirectory(root)) return [];
  return sourceModulesUnder(root).filter((path) => path === prefix || path.startsWith(`${prefix}/`));
}

function sourceModulesUnder(root: string): string[] {
  return readdirSync(root).flatMap((entry) => {
    const path = join(root, entry);
    if (statSync(path).isDirectory()) return sourceModulesUnder(path);
    return path.endsWith('.ts') || path.endsWith('.tsx') ? [path] : [];
  });
}

function existsAsDirectory(root: string): boolean {
  try {
    return statSync(root).isDirectory();
  } catch {
    return false;
  }
}

function report(what: string, offenders: readonly string[]): void {
  if (offenders.length === 0) return;
  console.log(`     ${what}:\n       ${offenders.join('\n       ')}`);
}

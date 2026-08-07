import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SEARCHED_ROOTS = [
  'abilities',
  'agents',
  'api',
  'checks',
  'data',
  'docs',
  'frontend',
  'library',
  'multiplayer',
  'procgen',
  'server',
  'tools',
  'world',
];

const MARKDOWN_IS_ALLOWED_AT = ['claude.md'];
const LONGEST_READABLE_CLAIM = 140;
const COMMENT_LINE = /^\s*(\/\/|\/\*|\*)/;

export function checkDocumentationHasNotRegrown(
  check: (name: string, condition: boolean) => void,
): void {
  const markdown = SEARCHED_ROOTS.flatMap((root) => filesUnder(root, '.md')).filter(
    (path) => !MARKDOWN_IS_ALLOWED_AT.includes(path),
  );
  report('markdown files outside the allowlist', markdown);
  check(
    'documentation is rendered from the code, so no prose file has grown back beside it',
    markdown.length === 0,
  );

  const commented = filesUnder('checks', '.ts').filter(hasACommentLine);
  report('comment lines inside checks', commented);
  check(
    'a sentence about this codebase lives in a check claim, never in a comment beside one',
    commented.length === 0,
  );

  const rambling = overlongClaims();
  report('claims longer than one readable sentence', rambling);
  check(
    'every claim stays one sentence, so a check cannot quietly become a paragraph',
    rambling.length === 0,
  );
}

function overlongClaims(): string[] {
  return filesUnder('checks', '.ts')
    .flatMap((path) => [...readFileSync(path, 'utf8').matchAll(/\bcheck\(\s*'([^']{20,})'/g)])
    .map((match) => match[1]!)
    .filter((claim) => claim.length > LONGEST_READABLE_CLAIM);
}

function hasACommentLine(path: string): boolean {
  return readFileSync(path, 'utf8').split('\n').some((line) => COMMENT_LINE.test(line));
}

function report(what: string, offenders: readonly string[]): void {
  if (offenders.length === 0) return;
  console.log(`     ${what}:\n       ${offenders.join('\n       ')}`);
}

function filesUnder(root: string, extension: string): string[] {
  if (!existsAsDirectory(root)) return [];
  return readdirSync(root).flatMap((entry) => {
    const path = join(root, entry);
    if (statSync(path).isDirectory()) return filesUnder(path, extension);
    return path.endsWith(extension) ? [path] : [];
  });
}

function existsAsDirectory(root: string): boolean {
  try {
    return statSync(root).isDirectory();
  } catch {
    return false;
  }
}

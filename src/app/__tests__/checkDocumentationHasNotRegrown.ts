import { readFileSync } from 'node:fs';
import { commentCountOf } from './commentCountOf';
import { endingIn, filesUnder } from './filesUnder';
import { reportOffenders } from './reportOffenders';

const SEARCHED_ROOTS = [
  'abilities',
  'agents',
  'api',
  'checks',
  'data',
  'docs',
  'frontend',
  'assets',
  'multiplayer',
  'perf',
  'procgen',
  'server',
  'tools',
  'world',
];

const MARKDOWN_IS_ALLOWED_AT = ['claude.md'];
const LONGEST_READABLE_CLAIM = 140;

export function checkDocumentationHasNotRegrown(
  check: (name: string, condition: boolean) => void,
): void {
  const markdown = SEARCHED_ROOTS.flatMap((root) => filesUnder(root, endingIn('.md'))).filter(
    (path) => !MARKDOWN_IS_ALLOWED_AT.includes(path),
  );
  reportOffenders('markdown files outside the allowlist', markdown);
  check(
    'documentation is rendered from the code, so no prose file has grown back beside it',
    markdown.length === 0,
  );

  const commented = everySourceFile().filter(hasAComment);
  reportOffenders('files carrying comments', commented);
  check(
    'a sentence about this codebase lives in a name or a check claim, never in a comment',
    commented.length === 0,
  );

  const rambling = overlongClaims();
  reportOffenders('claims longer than one readable sentence', rambling);
  check(
    'every claim stays one sentence, so a check cannot quietly become a paragraph',
    rambling.length === 0,
  );
}

function overlongClaims(): string[] {
  return filesUnder('checks', endingIn('.ts'))
    .flatMap((path) => [...readFileSync(path, 'utf8').matchAll(/\bcheck\(\s*'([^']{20,})'/g)])
    .map((match) => match[1]!)
    .filter((claim) => claim.length > LONGEST_READABLE_CLAIM);
}

function hasAComment(path: string): boolean {
  return commentCountOf(path) > 0;
}

const ROOT_LEVEL_SOURCES = ['vite.config.ts'];

function everySourceFile(): string[] {
  return [
    ...ROOT_LEVEL_SOURCES,
    ...SEARCHED_ROOTS.flatMap((root) => filesUnder(root, endingIn('.ts', '.tsx'))),
  ];
}


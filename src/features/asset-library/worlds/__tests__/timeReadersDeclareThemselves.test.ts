import { readFileSync } from 'node:fs';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { endingIn, filesUnder } from '@/features/app-shell/__tests__/filesUnder';
import { reportOffenders } from '@/features/app-shell/__tests__/reportOffenders';

const NODE_FOLDER = 'src/features/asset-library/worlds/nodes';

export function checkTimeReadersDeclareThemselves(check: CheckReporter): void {
  const readers = nodeFilesReadingTime();
  check('some node reads world time, so the rule below is about real code', readers.length > 0);
  const silent = readers.filter(doesNotDeclareItReadsTime);
  reportOffenders('node files that read ctx.time without declaring readsTime', silent);
  check(
    'every node file that consults world time declares readsTime, so scrubbing cannot leave it stale',
    silent.length === 0,
  );
}

function nodeFilesReadingTime(): string[] {
  return filesUnder(NODE_FOLDER, endingIn('.ts'))
    .filter((path) => readFileSync(path, 'utf8').includes('ctx.time'));
}

function doesNotDeclareItReadsTime(path: string): boolean {
  const source = readFileSync(path, 'utf8');
  return !/readsTime:\s*true/.test(source);
}

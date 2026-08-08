import { parseHeaviestProcessListing } from '../perf/heaviestHostProcesses';
import { forgetRecordedWork, recentWorkLoad, recordWork, WORK_WINDOW_MS } from '../perf/workTimers';

type CheckReporter = (name: string, condition: boolean) => void;

export function checkPerformanceReadouts(check: CheckReporter): void {
  checkTheWorkWindowForgetsWhatFellOutOfIt(check);
  checkAProcessListingBecomesRowsTheBadgeCanShow(check);
}

function checkTheWorkWindowForgetsWhatFellOutOfIt(check: CheckReporter): void {
  const restoreClock = withFakeClock();
  forgetRecordedWork();

  advanceClock(0);
  recordWork('chunk meshing', 4);
  recordWork('chunk meshing', 6);
  recordWork('gpu submit', 2);
  check(
    'work timed inside the window is summed per name and called out as the heaviest first',
    sameLoad(recentWorkLoad(), [
      { name: 'chunk meshing', msPerSecond: 10, callsPerSecond: 2 },
      { name: 'gpu submit', msPerSecond: 2, callsPerSecond: 1 },
    ]),
  );

  advanceClock(WORK_WINDOW_MS / 2);
  recordWork('gpu submit', 3);
  check(
    'work from earlier in the window still counts alongside newer work',
    sameLoad(recentWorkLoad(), [
      { name: 'chunk meshing', msPerSecond: 10, callsPerSecond: 2 },
      { name: 'gpu submit', msPerSecond: 5, callsPerSecond: 2 },
    ]),
  );

  advanceClock(WORK_WINDOW_MS);
  check(
    'work older than the window drops out instead of being read back off a reused bucket',
    recentWorkLoad().length === 0,
  );

  recordWork('gpu submit', 1);
  check(
    'a bucket reused a whole window later starts from nothing',
    sameLoad(recentWorkLoad(), [{ name: 'gpu submit', msPerSecond: 1, callsPerSecond: 1 }]),
  );

  forgetRecordedWork();
  restoreClock();
}

function checkAProcessListingBecomesRowsTheBadgeCanShow(check: CheckReporter): void {
  const rows = parseHeaviestProcessListing(
    [
      '  701   3.5  1.2 node',
      '  902  41.0  8.0 Google Chrome Helper (Renderer)',
      'ps: something went wrong',
      '',
      '  118   0.1  0.4 launchd',
    ].join('\n'),
  );
  check(
    'a process listing keeps only the lines that parse, heaviest first',
    rows.map((row) => row.pid).join() === '902,701,118',
  );
  check(
    'a command containing spaces survives the split into fields',
    rows[0]?.command === 'Google Chrome Helper (Renderer)',
  );
  check(
    'cpu and memory shares come back as numbers the panel can format',
    rows[0]?.cpuPercent === 41 && rows[0]?.memoryPercent === 8,
  );
}

interface ExpectedLoad {
  name: string;
  msPerSecond: number;
  callsPerSecond: number;
}

function sameLoad(actual: ExpectedLoad[], expected: ExpectedLoad[]): boolean {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

let fakeNowMs = 0;

function advanceClock(byMs: number): void {
  fakeNowMs += byMs;
}

function withFakeClock(): () => void {
  const realNow = performance.now.bind(performance);
  fakeNowMs = realNow();
  performance.now = () => fakeNowMs;
  return () => {
    performance.now = realNow;
  };
}

const LONG_TASK_WINDOW_MS = 5000;

export interface LongTaskLoad {
  windowSeconds: number;
  count: number;
  totalMs: number;
  worstMs: number;
  worstSource: string;
}

interface RecordedLongTask {
  endedAtMs: number;
  durationMs: number;
  source: string;
}

const recorded: RecordedLongTask[] = [];
let watchers = 0;
let observer: PerformanceObserver | null = null;

export function longTasksAreObservable(): boolean {
  return typeof PerformanceObserver !== 'undefined' &&
    PerformanceObserver.supportedEntryTypes?.includes('longtask') === true;
}

export function watchLongTasks(): () => void {
  if (watchers++ === 0) startObserving();
  return () => {
    if (--watchers === 0) stopObserving();
  };
}

export function recentLongTasks(): LongTaskLoad {
  const inWindow = pruneToWindow();
  return {
    windowSeconds: LONG_TASK_WINDOW_MS / 1000,
    count: inWindow.length,
    totalMs: inWindow.reduce((sum, task) => sum + task.durationMs, 0),
    worstMs: inWindow.reduce((worst, task) => Math.max(worst, task.durationMs), 0),
    worstSource: worstSourceOf(inWindow),
  };
}

function worstSourceOf(tasks: RecordedLongTask[]): string {
  return tasks.reduce<RecordedLongTask | null>(
    (worst, task) => (worst === null || task.durationMs > worst.durationMs ? task : worst),
    null,
  )?.source ?? '';
}

function pruneToWindow(): RecordedLongTask[] {
  const oldestKept = performance.now() - LONG_TASK_WINDOW_MS;
  while (recorded.length > 0 && recorded[0]!.endedAtMs < oldestKept) recorded.shift();
  return recorded;
}

function startObserving(): void {
  if (!longTasksAreObservable()) return;
  observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) rememberLongTask(entry);
  });
  observer.observe({ entryTypes: ['longtask'] });
}

function stopObserving(): void {
  observer?.disconnect();
  observer = null;
  recorded.length = 0;
}

function rememberLongTask(entry: PerformanceEntry): void {
  recorded.push({
    endedAtMs: entry.startTime + entry.duration,
    durationMs: entry.duration,
    source: longTaskSourceName(entry),
  });
}

function longTaskSourceName(entry: PerformanceEntry): string {
  const attribution = (entry as { attribution?: Array<{ name?: string }> }).attribution;
  return attribution?.[0]?.name ?? entry.name;
}

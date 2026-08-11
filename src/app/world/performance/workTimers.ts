const BUCKET_MS = 100;
const BUCKETS_KEPT = 10;

export const WORK_WINDOW_MS = BUCKET_MS * BUCKETS_KEPT;

export interface WorkLoad {
  name: string;
  msPerSecond: number;
  callsPerSecond: number;
}

interface WorkBucket {
  index: number;
  msByName: Map<string, number>;
  callsByName: Map<string, number>;
}

const buckets: WorkBucket[] = Array.from({ length: BUCKETS_KEPT }, () => emptyBucket(-1));

export function measureWork<T>(name: string, work: () => T): T {
  const startedMs = performance.now();
  try {
    return work();
  } finally {
    recordWork(name, performance.now() - startedMs);
  }
}

export function recordWork(name: string, elapsedMs: number): void {
  const bucket = bucketForNow();
  bucket.msByName.set(name, (bucket.msByName.get(name) ?? 0) + elapsedMs);
  bucket.callsByName.set(name, (bucket.callsByName.get(name) ?? 0) + 1);
}

export function recentWorkLoad(): WorkLoad[] {
  const totals = new Map<string, WorkLoad>();
  for (const bucket of bucketsInsideWindow()) addBucketToTotals(bucket, totals);
  return [...totals.values()].sort((a, b) => b.msPerSecond - a.msPerSecond);
}

export function forgetRecordedWork(): void {
  for (const bucket of buckets) resetBucket(bucket, -1);
}

function addBucketToTotals(bucket: WorkBucket, totals: Map<string, WorkLoad>): void {
  for (const [name, ms] of bucket.msByName) {
    const running = totals.get(name) ?? { name, msPerSecond: 0, callsPerSecond: 0 };
    running.msPerSecond += ms;
    running.callsPerSecond += bucket.callsByName.get(name) ?? 0;
    totals.set(name, running);
  }
}

function bucketsInsideWindow(): WorkBucket[] {
  const oldestKept = currentBucketIndex() - BUCKETS_KEPT + 1;
  return buckets.filter((bucket) => bucket.index >= oldestKept);
}

function bucketForNow(): WorkBucket {
  const index = currentBucketIndex();
  const bucket = buckets[index % BUCKETS_KEPT]!;
  if (bucket.index !== index) resetBucket(bucket, index);
  return bucket;
}

function currentBucketIndex(): number {
  return Math.floor(performance.now() / BUCKET_MS);
}

function emptyBucket(index: number): WorkBucket {
  return { index, msByName: new Map(), callsByName: new Map() };
}

function resetBucket(bucket: WorkBucket, index: number): void {
  bucket.index = index;
  bucket.msByName.clear();
  bucket.callsByName.clear();
}

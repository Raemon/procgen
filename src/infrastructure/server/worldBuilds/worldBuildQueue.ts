import {
  buildKeyOf,
  progressOfState,
  summaryOf,
  wholeWorldSpecOf,
  type BuildProgress,
  type BuildRequest,
  type BuildSummary,
  type WorldBuilds,
} from '@/features/asset-library/worlds/eval/builtValues';

export interface BuildRunner {
  run(request: BuildRequest, onProgress: (fraction: number, stage: string) => void): Promise<unknown>;
}

interface QueuedBuild {
  key: string;
  request: BuildRequest;
  progress: BuildProgress;
  startedAt: number | null;
  serialized: unknown | null;
  value: unknown | null;
}

const READY_BUILDS_KEPT = 6;

export class WorldBuildQueue implements WorldBuilds {
  private readonly entries = new Map<string, QueuedBuild>();
  private readonly listeners = new Set<() => void>();
  private pumping = false;

  constructor(private readonly runner: BuildRunner) {}

  valueOf(request: BuildRequest): unknown | null {
    return this.entryFor(request).value;
  }

  progressOf(request: BuildRequest): BuildProgress | null {
    return this.statusOf(buildKeyOf(request));
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  request(request: BuildRequest): BuildProgress {
    return this.liveProgress(this.entryFor(request));
  }

  statusOf(key: string): BuildProgress | null {
    const entry = this.entries.get(key);
    return entry ? this.liveProgress(entry) : null;
  }

  serializedOf(key: string): unknown | null {
    return this.entries.get(key)?.serialized ?? null;
  }

  summary(): BuildSummary {
    return summaryOf([...this.entries.values()].map((entry) => entry.progress));
  }

  private entryFor(request: BuildRequest): QueuedBuild {
    const key = buildKeyOf(request);
    const known = this.entries.get(key);
    if (known) return known;
    const entry: QueuedBuild = {
      key,
      request: { ...request, params: { ...request.params } },
      progress: progressOfState(request, 'queued', 0, 'waiting for the builder', 0),
      startedAt: null,
      serialized: null,
      value: null,
    };
    this.entries.set(key, entry);
    void this.pump();
    return entry;
  }

  private liveProgress(entry: QueuedBuild): BuildProgress {
    if (entry.progress.state !== 'building' || entry.startedAt === null) return entry.progress;
    return { ...entry.progress, elapsedMs: Date.now() - entry.startedAt };
  }

  private async pump(): Promise<void> {
    if (this.pumping) return;
    this.pumping = true;
    try {
      for (let next = this.nextQueued(); next; next = this.nextQueued()) await this.build(next);
    } finally {
      this.pumping = false;
    }
  }

  private nextQueued(): QueuedBuild | undefined {
    for (const entry of this.entries.values()) if (entry.progress.state === 'queued') return entry;
    return undefined;
  }

  private async build(entry: QueuedBuild): Promise<void> {
    entry.startedAt = Date.now();
    entry.progress = progressOfState(entry.request, 'building', 0, 'starting', 0);
    try {
      const serialized = await this.runner.run(entry.request, (fraction, stage) => {
        entry.progress = progressOfState(entry.request, 'building', fraction, stage, Date.now() - entry.startedAt!);
      });
      entry.serialized = serialized;
      entry.value = wholeWorldSpecOf(entry.request.nodeType)!.parse(serialized);
      entry.progress = progressOfState(entry.request, 'ready', 1, 'built', Date.now() - entry.startedAt);
      this.forgetOldReadyBuilds();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      entry.progress = progressOfState(entry.request, 'failed', 0, 'failed', Date.now() - entry.startedAt, message);
      console.warn(`[builds] ${entry.request.nodeType} ${entry.key} failed: ${message}`);
    }
    for (const listener of this.listeners) listener();
  }

  private forgetOldReadyBuilds(): void {
    const ready = [...this.entries.values()].filter((entry) => entry.progress.state === 'ready');
    for (const stale of ready.slice(0, Math.max(0, ready.length - READY_BUILDS_KEPT))) {
      this.entries.delete(stale.key);
    }
  }
}

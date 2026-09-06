import {
  buildKeyOf,
  progressOfState,
  wholeWorldSpecOf,
  type BuildProgress,
  type BuildRequest,
  type BuiltValueSource,
} from '@/features/asset-library/worlds/eval/builtValues';

interface RemoteBuild {
  request: BuildRequest;
  progress: BuildProgress;
  value: unknown | null;
}

interface BuildBody {
  build?: {
    state?: string;
    fraction?: number;
    stage?: string;
    elapsed_ms?: number;
    error?: string | null;
  };
  value?: unknown;
}

const BUILDS_URL = '/api/v1/asset-library/world-seeds/builds';
const POLL_MS = 400;
const RETRY_MS = 1500;
const READY_BUILDS_KEPT = 8;

export class RemoteBuiltValues implements BuiltValueSource {
  private readonly builds = new Map<string, RemoteBuild>();
  private readonly listeners = new Set<() => void>();

  valueOf(request: BuildRequest): unknown | null {
    return this.buildFor(request).value;
  }

  progressOf(request: BuildRequest): BuildProgress | null {
    return this.builds.get(buildKeyOf(request))?.progress ?? null;
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  pending(): BuildProgress[] {
    return [...this.builds.values()]
      .filter((build) => build.value === null)
      .map((build) => build.progress);
  }

  private buildFor(request: BuildRequest): RemoteBuild {
    const key = buildKeyOf(request);
    const known = this.builds.get(key);
    if (known) return known;
    const build: RemoteBuild = {
      request: { ...request, params: { ...request.params } },
      progress: progressOfState(request, 'queued', 0, 'asking the server', 0),
      value: null,
    };
    this.builds.set(key, build);
    void this.start(build);
    return build;
  }

  private async start(build: RemoteBuild): Promise<void> {
    const body = {
      node_type: build.request.nodeType,
      seed: build.request.seed,
      params: build.request.params,
    };
    await this.exchange(build, () =>
      fetch(BUILDS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    );
  }

  private async poll(build: RemoteBuild): Promise<void> {
    await this.exchange(build, () => fetch(`${BUILDS_URL}/${build.progress.key}`));
  }

  private async exchange(build: RemoteBuild, send: () => Promise<Response>): Promise<void> {
    try {
      const response = await send();
      if (!response.ok && response.status !== 202) throw new Error(`the server answered ${response.status}`);
      this.accept(build, (await response.json()) as BuildBody);
    } catch (error) {
      build.progress = progressOfState(build.request, 'queued', 0, 'waiting for the server', 0, messageOf(error));
      window.setTimeout(() => void this.poll(build), RETRY_MS);
      this.notify();
    }
  }

  private accept(build: RemoteBuild, body: BuildBody): void {
    const reported = body.build ?? {};
    const state = reported.state === 'ready' || reported.state === 'failed' || reported.state === 'building' ? reported.state : 'queued';
    build.progress = progressOfState(
      build.request,
      state,
      reported.fraction ?? 0,
      reported.stage ?? '',
      reported.elapsed_ms ?? 0,
      reported.error ?? null,
    );
    if (state === 'ready' && body.value !== null && body.value !== undefined) {
      build.value = wholeWorldSpecOf(build.request.nodeType)?.parse(body.value) ?? null;
      this.forgetOldReadyBuilds();
    } else if (state !== 'failed') {
      window.setTimeout(() => void this.poll(build), POLL_MS);
    }
    this.notify();
  }

  private forgetOldReadyBuilds(): void {
    const ready = [...this.builds.entries()].filter(([, build]) => build.value !== null);
    for (const [key] of ready.slice(0, Math.max(0, ready.length - READY_BUILDS_KEPT))) this.builds.delete(key);
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

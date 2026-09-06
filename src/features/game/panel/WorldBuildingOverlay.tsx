import { useCallback, useSyncExternalStore } from 'react';
import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import type { AppRuntime } from '@/features/app-shell/runtime/appRuntime';
import type { BuildProgress } from '@/features/asset-library/worlds/eval/builtValues';

export function WorldBuildingOverlay() {
  const runtime = useAppRuntime();
  const shown = useSyncExternalStore(
    useCallback((onChange) => subscribeToBuilds(runtime, onChange), [runtime]),
    useCallback(() => JSON.stringify(pendingBuildsOf(runtime)), [runtime]),
  );
  const pending = JSON.parse(shown) as BuildProgress[];
  if (pending.length === 0) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/60">
      <div className="flex w-72 flex-col gap-2 rounded border border-edge bg-panel/95 p-4 font-mono text-[12px] text-ink shadow-lg">
        <div className="text-[13px]">building this world on the server</div>
        {pending.map((build) => (
          <BuildRow key={build.key} build={build} />
        ))}
      </div>
    </div>
  );
}

function BuildRow({ build }: { build: BuildProgress }) {
  const percent = Math.round(build.fraction * 100);
  const seconds = (build.elapsedMs / 1000).toFixed(1);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between gap-2">
        <span>{build.nodeType}</span>
        <span className="text-ink-dim">{build.state === 'failed' ? 'failed' : `${build.stage} ${percent}% · ${seconds}s`}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded bg-black/40">
        <div
          className={build.state === 'failed' ? 'h-full bg-danger-ink' : 'h-full bg-accent transition-[width]'}
          style={{ width: `${build.state === 'failed' ? 100 : percent}%` }}
        />
      </div>
      {build.error && <div className="text-danger-ink">{build.error}</div>}
    </div>
  );
}

function pendingBuildsOf(runtime: AppRuntime): BuildProgress[] {
  const own = runtime.evaluator.buildProgress();
  if (own.length > 0 || runtime.evaluator.ready()) return own;
  return runtime.evaluator.missingBuilds().map((node) => ({
    key: node.id,
    nodeType: node.type,
    state: 'queued' as const,
    fraction: 0,
    stage: 'asking the server',
    elapsedMs: 0,
    estimatedMs: 0,
    error: null,
  }));
}

function subscribeToBuilds(runtime: AppRuntime, onChange: () => void): () => void {
  const stopBuilds = runtime.builds.onChange(onChange);
  const stopWorld = runtime.subscribeToWorldChange(onChange);
  return () => {
    stopBuilds();
    stopWorld();
  };
}

'use client';

import { Button } from '@/features/app-shell/controls/Button';
import { genomeFromJson } from '../selfPlay/worldGenome';
import type { LabRunWorld } from './labClient';
import { reshootWorld, useWorldShot } from './useWorldShot';

export function EliteCard({
  world,
  installedAs,
  onInstall,
  onOpenShot,
}: {
  world: LabRunWorld;
  installedAs: string | null;
  onInstall: () => void;
  onOpenShot: (url: string) => void;
}) {
  const genome = world.genome === null ? null : genomeFromJson(world.genome);
  const shot = useWorldShot(genome);
  return (
    <div className="flex flex-col gap-1 rounded border border-panel-edge bg-panel p-2">
      <button
        type="button"
        className="relative block aspect-[3/2] w-full cursor-pointer overflow-hidden rounded border border-panel-edge bg-field"
        onClick={() => shot?.url && onOpenShot(shot.url)}
      >
        {shot?.url ? (
          <img alt={world.name} src={shot.url} className="h-full w-full object-cover" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-[11px] text-ink-dim">
            {shotWord(shot?.status ?? 'waiting', shot?.failure ?? null)}
          </span>
        )}
      </button>
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate text-xs text-ink">
          {world.rank}. {world.name}
        </span>
        <span className="text-xs text-accent">{world.fun.toFixed(3)}</span>
      </div>
      <ul className="text-[10px] leading-relaxed text-ink-dim">
        {world.weakest_readings.slice(0, 3).map((reading) => (
          <li key={reading.name}>
            {reading.name} {reading.value.toFixed(2)} ({reading.score.toFixed(2)})
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2">
        {installedAs === null ? (
          <Button onClick={onInstall} disabled={genome === null}>
            install
          </Button>
        ) : (
          <span className="text-[10px] text-ink-dim">
            installed as {installedAs} —{' '}
            <a className="text-accent underline underline-offset-2" href="/">
              open the editor
            </a>
          </span>
        )}
        <Button onClick={() => genome && reshootWorld(genome)} disabled={genome === null}>
          re-shoot
        </Button>
      </div>
    </div>
  );
}

function shotWord(status: string, failure: string | null): string {
  if (status === 'failed') return failure?.toLowerCase().includes('webgl') ? 'no WebGL' : 'shot failed';
  if (status === 'shooting') return 'rendering…';
  return 'waiting for a render';
}

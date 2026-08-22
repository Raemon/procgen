'use client';

import { useState } from 'react';
import { EliteCard } from './EliteCard';
import type { LabRunWorld } from './labClient';

export function EliteGrid({
  worlds,
  installedNames,
  onInstall,
}: {
  worlds: LabRunWorld[];
  installedNames: Map<string, string>;
  onInstall: (name: string) => void;
}) {
  const [opened, setOpened] = useState<string | null>(null);
  if (worlds.length === 0) {
    return <p className="text-[11px] text-ink-dim">no elite has been admitted yet</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-2">
        {worlds.map((world) => (
          <EliteCard
            key={world.name}
            world={world}
            installedAs={installedNames.get(world.name) ?? null}
            onInstall={() => onInstall(world.name)}
            onOpenShot={setOpened}
          />
        ))}
      </div>
      {opened === null ? null : (
        <button
          type="button"
          className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/80 p-6"
          onClick={() => setOpened(null)}
        >
          <img alt="world shot" src={opened} className="max-h-full max-w-full" />
        </button>
      )}
    </div>
  );
}

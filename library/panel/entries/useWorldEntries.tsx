import { useSyncExternalStore } from 'react';
import { useAppRuntime } from '../../../frontend/appRuntimeContext';
import type { WorldPreset } from '../../../procgen/presets/worldPreset';
import { worldTip } from '../../help/libraryTips';
import { WorldThumbnailIcon } from '../icons/WorldThumbnailIcon';
import { useThumbnailOfTheRunningWorld } from '../icons/useWorldThumbnail';
import { useRunningWorld } from '../useRunningWorld';
import { worldThumbnails } from '../../worldThumbnails';
import type { LibraryEntry } from './libraryEntry';

export function useWorldEntries(): LibraryEntry[] {
  const { perform, worlds } = useAppRuntime();
  const running = useRunningWorld();
  useThumbnailOfTheRunningWorld();
  const shelf = useSyncExternalStore(
    (listener) => worlds.onChange(listener),
    () => worlds.all(),
  );
  return shelf.map((world) => worldEntry(world, running, perform));
}

type Perform = (action: string, params?: Record<string, unknown>) => unknown;

function worldEntry(world: WorldPreset, running: string, perform: Perform): LibraryEntry {
  return {
    key: world.name,
    name: world.name,
    icon: <WorldThumbnailIcon worldName={world.name} />,
    tip: worldTip(world.name, world.description, world.name === running),
    running: world.name === running,
    run: () => perform('run_world', { name: world.name }),
    duplicate: () => perform('duplicate_preset', { name: world.name }),
    remove: () => {
      perform('delete_preset', { name: world.name });
      worldThumbnails.forget(world.name);
    },
  };
}

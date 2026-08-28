import type { CommandParams, CommandResult } from '@/features/app-shell/runtime/commands/command';
import { useSyncExternalStore } from 'react';
import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import type { WorldSeed } from '@/features/asset-library/worlds/seeds/worldSeed';
import { worldSeedTip } from '../../help/libraryTips';
import { WorldSeedThumbnailIcon } from '../icons/WorldSeedThumbnailIcon';
import { useThumbnailOfTheRunningWorld } from '../icons/useWorldSeedThumbnail';
import { useRunningWorldSeed } from '../useRunningWorld';
import { worldSeedThumbnails } from '../../worldSeedThumbnails';
import { useFollowRenamedRow, type FollowRenamedRow } from './useFollowRenamedRow';
import type { LibraryEntry } from './libraryEntry';

export function useWorldSeedEntries(): LibraryEntry[] {
  const { perform, worldSeedShelf } = useAppRuntime();
  const followRenamed = useFollowRenamedRow('worldSeeds');
  const running = useRunningWorldSeed();
  useThumbnailOfTheRunningWorld();
  const shelf = useSyncExternalStore(
    (listener) => worldSeedShelf.onChange(listener),
    () => worldSeedShelf.all(),
  );
  return shelf.map((seed) => worldSeedEntry(seed, running, perform, followRenamed));
}

type Perform = (action: string, params?: CommandParams) => CommandResult;

function worldSeedEntry(
  seed: WorldSeed,
  running: string,
  perform: Perform,
  followRenamed: FollowRenamedRow,
): LibraryEntry {
  return {
    key: seed.name,
    name: seed.name,
    icon: <WorldSeedThumbnailIcon seedName={seed.name} />,
    tip: worldSeedTip(seed.name, seed.description, seed.name === running),
    running: seed.name === running,
    rename: (name) => renameWorldSeed(seed.name, name, perform, followRenamed),
    run: () => perform('run_world_seed', { name: seed.name }),
    duplicate: () => perform('duplicate_world_seed', { name: seed.name }),
    remove: () => {
      perform('delete_world_seed', { name: seed.name });
      worldSeedThumbnails.forget(seed.name);
    },
  };
}

function renameWorldSeed(
  from: string,
  to: string,
  perform: Perform,
  followRenamed: FollowRenamedRow,
): void {
  if (!perform('rename_world_seed', { name: from, new_name: to }).ok) return;
  worldSeedThumbnails.copy(from, to);
  worldSeedThumbnails.forget(from);
  followRenamed(from, to);
}

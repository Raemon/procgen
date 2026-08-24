import type { CommandParams, CommandResult } from '@/features/app-shell/runtime/commands/command';
import { useSyncExternalStore } from 'react';
import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import type { WorldSeed } from '@/features/asset-library/worlds/seeds/worldSeed';
import { worldSeedTip } from '../../help/libraryTips';
import { WorldSeedThumbnailIcon } from '../icons/WorldSeedThumbnailIcon';
import { useThumbnailOfTheRunningWorld } from '../icons/useWorldSeedThumbnail';
import { useRunningWorld } from '../useRunningWorld';
import { worldSeedThumbnails } from '../../worldSeedThumbnails';
import { useFollowRenamedRow, type FollowRenamedRow } from './useFollowRenamedRow';
import type { LibraryEntry } from './libraryEntry';

export function useWorldSeedEntries(): LibraryEntry[] {
  const { perform, worlds } = useAppRuntime();
  const followRenamed = useFollowRenamedRow('worlds');
  const running = useRunningWorld();
  useThumbnailOfTheRunningWorld();
  const shelf = useSyncExternalStore(
    (listener) => worlds.onChange(listener),
    () => worlds.all(),
  );
  return shelf.map((world) => worldEntry(world, running, perform, followRenamed));
}

type Perform = (action: string, params?: CommandParams) => CommandResult;

function worldEntry(
  world: WorldSeed,
  running: string,
  perform: Perform,
  followRenamed: FollowRenamedRow,
): LibraryEntry {
  return {
    key: world.name,
    name: world.name,
    icon: <WorldSeedThumbnailIcon worldName={world.name} />,
    tip: worldSeedTip(world.name, world.description, world.name === running),
    running: world.name === running,
    rename: (name) => renameWorld(world.name, name, perform, followRenamed),
    run: () => perform('run_world_seed', { name: world.name }),
    duplicate: () => perform('duplicate_world_seed', { name: world.name }),
    remove: () => {
      perform('delete_world_seed', { name: world.name });
      worldSeedThumbnails.forget(world.name);
    },
  };
}

function renameWorld(
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

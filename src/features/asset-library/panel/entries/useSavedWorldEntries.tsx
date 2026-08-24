import { useSyncExternalStore } from 'react';
import type { CommandParams, CommandResult } from '@/features/app-shell/runtime/commands/command';
import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import type { SavedWorld } from '@/features/asset-library/worlds/saved/savedWorld';
import { savedWorldTip } from '../../help/libraryTips';
import { WorldSeedThumbnailIcon } from '../icons/WorldSeedThumbnailIcon';
import { useRunningSavedWorld } from '../useRunningWorld';
import { useFollowRenamedRow, type FollowRenamedRow } from './useFollowRenamedRow';
import type { LibraryEntry } from './libraryEntry';

export function useSavedWorldEntries(): LibraryEntry[] {
  const { perform, savedWorlds } = useAppRuntime();
  const followRenamed = useFollowRenamedRow('savedWorlds');
  const running = useRunningSavedWorld();
  const kept = useSyncExternalStore(
    (listener) => savedWorlds.onChange(listener),
    () => savedWorlds.all(),
  );
  return kept.map((saved) => savedWorldEntry(saved, running, perform, followRenamed));
}

type Perform = (action: string, params?: CommandParams) => CommandResult;

function savedWorldEntry(
  saved: SavedWorld,
  running: string,
  perform: Perform,
  followRenamed: FollowRenamedRow,
): LibraryEntry {
  return {
    key: saved.name,
    name: saved.name,
    icon: <WorldSeedThumbnailIcon worldName={saved.seededBy} />,
    tip: savedWorldTip(saved, saved.name === running),
    running: saved.name === running,
    rename: (name) => {
      if (perform('rename_saved_world', { name: saved.name, new_name: name }).ok) {
        followRenamed(saved.name, name);
      }
    },
    run: () => perform('run_saved_world', { name: saved.name }),
    duplicate: () => perform('duplicate_saved_world', { name: saved.name }),
    remove: () => perform('delete_saved_world', { name: saved.name }),
  };
}

import { useSyncExternalStore } from 'react';
import type { CommandParams, CommandResult } from '@/features/app-shell/runtime/commands/command';
import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import type { SavedWorld } from '@/features/asset-library/worlds/saved/savedWorld';
import { savedWorldTip } from '../../help/libraryTips';
import { WorldSeedThumbnailIcon } from '../icons/WorldSeedThumbnailIcon';
import { useRunningSavedWorld } from '../useRunningWorld';
import { useRenameSavedWorld, type RenameLibraryRow } from '../useLibraryRename';
import type { LibraryEntry } from './libraryEntry';

export function useSavedWorldEntries(): LibraryEntry[] {
  const { perform, savedWorlds } = useAppRuntime();
  const renameSavedWorld = useRenameSavedWorld();
  const running = useRunningSavedWorld();
  const kept = useSyncExternalStore(
    (listener) => savedWorlds.onChange(listener),
    () => savedWorlds.all(),
  );
  return kept.map((saved) => savedWorldEntry(saved, running, perform, renameSavedWorld));
}

type Perform = (action: string, params?: CommandParams) => CommandResult;

function savedWorldEntry(
  saved: SavedWorld,
  running: string,
  perform: Perform,
  renameSavedWorld: RenameLibraryRow,
): LibraryEntry {
  return {
    key: saved.name,
    name: saved.name,
    icon: <WorldSeedThumbnailIcon seedName={saved.seededBy} />,
    tip: savedWorldTip(saved, saved.name === running),
    running: saved.name === running,
    rename: (name) => renameSavedWorld(saved.name, name),
    run: () => perform('run_saved_world', { name: saved.name }),
    duplicate: () => perform('duplicate_saved_world', { name: saved.name }),
    remove: () => perform('delete_saved_world', { name: saved.name }),
  };
}

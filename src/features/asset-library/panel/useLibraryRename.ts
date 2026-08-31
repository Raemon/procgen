import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import { worldSeedThumbnails } from '../worldSeedThumbnails';
import { useFollowRenamedRow } from './entries/useFollowRenamedRow';

export type RenameLibraryRow = (from: string, to: string) => void;

export function useRenameWorldSeed(): RenameLibraryRow {
  const { perform } = useAppRuntime();
  const followRenamed = useFollowRenamedRow('worldSeeds');
  return (from, to) => {
    if (!perform('rename_world_seed', { name: from, new_name: to }).ok) return;
    worldSeedThumbnails.copy(from, to);
    worldSeedThumbnails.forget(from);
    followRenamed(from, to);
  };
}

export function useRenameSavedWorld(): RenameLibraryRow {
  const { perform } = useAppRuntime();
  const followRenamed = useFollowRenamedRow('savedWorlds');
  return (from, to) => {
    if (perform('rename_saved_world', { name: from, new_name: to }).ok) followRenamed(from, to);
  };
}

export function useRenameNodeGroup(): RenameLibraryRow {
  const { perform } = useAppRuntime();
  const followRenamed = useFollowRenamedRow('groups');
  return (from, to) => {
    if (perform('rename_template', { name: from, new_name: to }).ok) followRenamed(from, to);
  };
}

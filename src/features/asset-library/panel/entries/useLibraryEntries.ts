import type { LibraryFolder } from '../../librarySelection';
import type { LibraryEntry } from './libraryEntry';
import { useCreatureEntries } from './useCreatureEntries';
import { useCultureEntries } from './useCultureEntries';
import { useItemEntries } from './useItemEntries';
import { useNodeGroupEntries } from './useNodeGroupEntries';
import { usePieceEntries } from './usePieceEntries';
import { useTileEntries } from './useTileEntries';
import { useWorldSeedEntries } from './useWorldSeedEntries';

export function useLibraryEntries(): Record<LibraryFolder, LibraryEntry[]> {
  return {
    worlds: useWorldSeedEntries(),
    tiles: useTileEntries(),
    items: useItemEntries(),
    pieces: usePieceEntries(),
    cultures: useCultureEntries(),
    creatures: useCreatureEntries('creatures'),
    characters: useCreatureEntries('characters'),
    groups: useNodeGroupEntries(),
  };
}

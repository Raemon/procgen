import { useAppRuntime } from '../../../frontend/appRuntimeContext';
import { useRerenderOnTileAssetChange } from '../../../frontend/rerenderHooks';
import { TileIcon } from '../icons/TileIcon';
import type { LibraryEntry } from './libraryEntry';

export function useTileEntries(): LibraryEntry[] {
  const { tileAssets, perform } = useAppRuntime();
  useRerenderOnTileAssetChange();
  return tileAssets.all().map((tile) => ({
    key: String(tile.id),
    name: tile.name,
    icon: <TileIcon tile={tile} />,
    tip: {
      title: tile.name,
      body: `tile ${tile.id} · symbol “${tile.symbol}” · ${tile.walkable ? 'walkable' : 'blocking'}`,
    },
    duplicate: () => perform('duplicate_tile', { tile_id: tile.id }),
    remove: () => perform('remove_tile', { tile_id: tile.id }),
  }));
}

import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import { useRerenderOnTileAssetChange } from '@/features/app-shell/runtime/rerenderHooks';
import { TileIcon } from '../icons/TileIcon';
import type { LibraryEntry } from './libraryEntry';

export function useTileEntries(): LibraryEntry[] {
  const { tileAssets, perform } = useAppRuntime();
  useRerenderOnTileAssetChange();
  return tileAssets.all().map((tile) => ({
    key: String(tile.id),
    name: tile.name,
    icon: <TileIcon tile={tile} />,
    rowAdornment: (
      <span className="w-4 shrink-0 text-center font-mono text-sm" style={{ color: tile.color }}>
        {tile.symbol}
      </span>
    ),
    tip: {
      title: tile.name,
      body: `tile ${tile.id} · symbol “${tile.symbol}” · ${tile.walkable ? 'walkable' : 'blocking'}`,
    },
    rename: (name: string) => perform('update_tile', { tile_id: tile.id, name }),
    duplicate: () => perform('duplicate_tile', { tile_id: tile.id }),
    remove: () => perform('remove_tile', { tile_id: tile.id }),
  }));
}

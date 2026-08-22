import { Fragment, useState, useSyncExternalStore, type DragEvent } from 'react';
import { classes } from '@/features/app-shell/controls/classes';
import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import type { ReadOnlyAssetFolders } from '@/features/app-shell/runtime/readOnlyAssets';
import type { LibraryFolder } from '../../librarySelection';
import type { LibraryEntry } from '../entries/libraryEntry';
import { LibraryRow } from '../LibraryRow';
import { useLibraryViewMode } from '../libraryViewMode';
import { AssetFolderRow } from './AssetFolderRow';
import { carriesAssetFolderOf, draggedAssetFolder } from './assetDragTransfer';

export function AssetFolderTree({
  section,
  entries,
  parentId,
}: {
  section: LibraryFolder;
  entries: readonly LibraryEntry[];
  parentId: string | null;
}) {
  const { assetFolders, perform } = useAppRuntime();
  useSyncExternalStore(
    (listener) => assetFolders.onChange(listener),
    () => assetFolders.stored(),
    () => assetFolders.stored(),
  );
  const folders = assetFolders.childrenOf(section, parentId);
  const filedHere = entries.filter(
    (entry) => assetFolders.folderOf(section, entry.key) === parentId,
  );
  return (
    <>
      {folders.map((folder) => (
        <Fragment key={folder.id}>
          <SiblingDropStrip section={section} beforeId={folder.id} />
          <AssetFolderRow
            folder={folder}
            count={entriesUnder(assetFolders, section, folder.id, entries)}
          >
            <AssetFolderTree section={section} entries={entries} parentId={folder.id} />
          </AssetFolderRow>
        </Fragment>
      ))}
      {filedHere.map((entry) => (
        <LibraryRow
          key={entry.key}
          folder={section}
          entry={unfiledWhenRemoved(entry, section, perform)}
        />
      ))}
    </>
  );
}

function SiblingDropStrip({
  section,
  beforeId,
}: {
  section: LibraryFolder;
  beforeId: string;
}) {
  const { assetFolders, perform } = useAppRuntime();
  const viewMode = useLibraryViewMode();
  const [hovering, setHovering] = useState(false);
  function drop(event: DragEvent<HTMLDivElement>): void {
    setHovering(false);
    const draggedId = draggedAssetFolder(event.dataTransfer);
    if (!draggedId || draggedId === beforeId) return;
    event.preventDefault();
    perform('move_asset_folder', {
      folder_id: draggedId,
      parent_id: assetFolders.byId(beforeId)?.parentId ?? '',
      before_id: beforeId,
    });
  }
  return (
    <div
      aria-label={`drop a folder in front of ${beforeId}`}
      className={classes(
        'h-1 rounded-full',
        viewMode === 'grid' && 'col-span-full',
        hovering && 'bg-accent',
      )}
      onDragOver={(event) => {
        if (!carriesAssetFolderOf(event.dataTransfer, section)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        setHovering(true);
      }}
      onDragLeave={() => setHovering(false)}
      onDrop={drop}
    />
  );
}

function unfiledWhenRemoved(
  entry: LibraryEntry,
  section: LibraryFolder,
  perform: (action: string, params?: Record<string, unknown>) => unknown,
): LibraryEntry {
  if (!entry.remove) return entry;
  const remove = entry.remove;
  return {
    ...entry,
    remove: () => {
      perform('file_asset', { section, key: entry.key });
      remove();
    },
  };
}

function entriesUnder(
  assetFolders: ReadOnlyAssetFolders,
  section: LibraryFolder,
  folderId: string,
  entries: readonly LibraryEntry[],
): number {
  return entries.filter((entry) =>
    descendsFrom(assetFolders, assetFolders.folderOf(section, entry.key), folderId),
  ).length;
}

function descendsFrom(
  assetFolders: ReadOnlyAssetFolders,
  at: string | null,
  folderId: string,
): boolean {
  let walking = at;
  while (walking !== null) {
    if (walking === folderId) return true;
    walking = assetFolders.byId(walking)?.parentId ?? null;
  }
  return false;
}

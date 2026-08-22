import { useState, type DragEvent, type ReactNode } from 'react';
import { classes } from '@/features/app-shell/controls/classes';
import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import { PERSISTED_UI_KEYS } from '@/features/app-shell/state/persistedUiKeys';
import { usePersistedUiSet } from '@/features/app-shell/state/usePersistedUiSet';
import type { TooltipContent } from '@/features/app-shell/tooltips/tooltipContent';
import { tooltipHandlers } from '@/features/app-shell/tooltips/tooltipHandlers';
import { dropIntoSectionTip } from '../help/folderTips';
import { openFolderTip } from '../help/libraryTips';
import type { LibraryFolder as FolderName } from '../librarySelection';
import {
  carriesAnythingFileableIn,
  draggedAsset,
  draggedAssetFolder,
} from './folders/assetDragTransfer';
import { useLibraryViewMode } from './libraryViewMode';

const OPEN_UNTIL_A_FOLDER_IS_TOGGLED: FolderName[] = ['worlds'];

export function LibraryFolder({
  folder,
  label,
  tip,
  count,
  children,
}: {
  folder: FolderName;
  label?: string;
  tip: TooltipContent;
  count: number;
  children: ReactNode;
}) {
  const name = label ?? folder;
  const { perform } = useAppRuntime();
  const openFolders = usePersistedUiSet(
    PERSISTED_UI_KEYS.openLibraryFolders,
    OPEN_UNTIL_A_FOLDER_IS_TOGGLED,
  );
  const open = openFolders.has(folder);
  const viewMode = useLibraryViewMode();
  const [hoveringWithADrop, setHoveringWithADrop] = useState(false);

  function unfileWhatWasDropped(event: DragEvent<HTMLButtonElement>): void {
    setHoveringWithADrop(false);
    const asset = draggedAsset(event.dataTransfer);
    if (asset?.section === folder) {
      event.preventDefault();
      perform('file_asset', { section: folder, key: asset.key });
      return;
    }
    const draggedId = draggedAssetFolder(event.dataTransfer);
    if (!draggedId) return;
    event.preventDefault();
    perform('move_asset_folder', { folder_id: draggedId });
  }

  return (
    <section className="mb-1">
      <button
        type="button"
        className={classes(
          'flex w-full cursor-pointer items-center gap-1.5 rounded border px-1 py-1 text-left hover:border-panel-edge hover:bg-field',
          hoveringWithADrop ? 'border-accent bg-field' : 'border-transparent',
        )}
        onClick={() => openFolders.toggle(folder)}
        onDragOver={(event) => {
          if (!carriesAnythingFileableIn(event.dataTransfer, folder)) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = 'move';
          setHoveringWithADrop(true);
        }}
        onDragLeave={() => setHoveringWithADrop(false)}
        onDrop={unfileWhatWasDropped}
        {...tooltipHandlers(
          hoveringWithADrop ? dropIntoSectionTip(name) : open ? openFolderTip(name, tip) : tip,
        )}
      >
        <span className="w-2 text-[10px] text-ink-dim">{open ? '▾' : '▸'}</span>
        <span className="flex-1 text-xs tracking-[0.08em] text-ink uppercase">{name}</span>
        <span className="text-[10px] text-ink-dim">{count}</span>
      </button>
      {open ? (
        <div
          className={classes(
            'mb-1.5 ml-2 border-l border-panel-edge pl-1.5',
            viewMode === 'grid' &&
              'grid grid-cols-[repeat(auto-fill,minmax(76px,1fr))] gap-x-1 gap-y-1.5 [&>button]:col-span-full',
          )}
        >
          {children}
        </div>
      ) : null}
    </section>
  );
}

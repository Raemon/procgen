import { useRef, useState, type DragEvent, type ReactNode } from 'react';
import { ConfirmModal } from '@/features/app-shell/controls/ConfirmModal';
import { IconButton } from '@/features/app-shell/controls/IconButton';
import { classes } from '@/features/app-shell/controls/classes';
import { REVEALED_ON_ROW_HOVER, ROW_HOVER_GROUP } from '@/features/app-shell/controls/revealOnRowHover';
import { TrashIcon } from '@/features/app-shell/icons/rowActionIcons';
import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import { PERSISTED_UI_KEYS } from '@/features/app-shell/state/persistedUiKeys';
import { usePersistedUiSet } from '@/features/app-shell/state/usePersistedUiSet';
import { tooltipHandlers } from '@/features/app-shell/tooltips/tooltipHandlers';
import type { AssetFolder } from '../../folders/assetFolder';
import {
  addSubfolderTip,
  assetFolderTip,
  ASSET_FOLDER_NAME_TIP,
  deleteAssetFolderConfirmation,
  deleteAssetFolderTip,
  renameAssetFolderTip,
} from '../../help/folderTips';
import { useLibraryViewMode } from '../libraryViewMode';
import {
  carriesAnythingFileableIn,
  draggedAsset,
  draggedAssetFolder,
  startAssetFolderDrag,
} from './assetDragTransfer';

const ACTION_BUTTON_CLASSES = 'h-5 w-5 rounded-sm border-transparent bg-transparent';

export function AssetFolderRow({
  folder,
  count,
  children,
}: {
  folder: AssetFolder;
  count: number;
  children: ReactNode;
}) {
  const { perform } = useAppRuntime();
  const openFolders = usePersistedUiSet(PERSISTED_UI_KEYS.openAssetFolders);
  const open = openFolders.has(folder.id);
  const viewMode = useLibraryViewMode();
  const [renaming, setRenaming] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [hoveringWithADrop, setHoveringWithADrop] = useState(false);

  function acceptDrop(event: DragEvent<HTMLElement>): void {
    setHoveringWithADrop(false);
    const asset = draggedAsset(event.dataTransfer);
    if (asset?.section === folder.section) {
      event.preventDefault();
      perform('file_asset', { section: asset.section, key: asset.key, folder_id: folder.id });
      return;
    }
    const draggedId = draggedAssetFolder(event.dataTransfer);
    if (!draggedId || draggedId === folder.id) return;
    event.preventDefault();
    perform('move_asset_folder', { folder_id: draggedId, parent_id: folder.id });
  }

  return (
    <section
      className={classes(
        'mb-1 rounded border border-dashed',
        viewMode === 'grid' && 'col-span-full',
        hoveringWithADrop ? 'border-accent bg-btn-active/40' : 'border-panel-edge',
      )}
    >
      <div
        className={classes(ROW_HOVER_GROUP, 'flex w-full items-center gap-1 px-1 py-1')}
        draggable={!renaming}
        onDragStart={(event) => startAssetFolderDrag(event.dataTransfer, folder.section, folder.id)}
        onDragOver={(event) => {
          if (!carriesAnythingFileableIn(event.dataTransfer, folder.section)) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = 'move';
          setHoveringWithADrop(true);
        }}
        onDragLeave={(event) => {
          if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
          setHoveringWithADrop(false);
        }}
        onDrop={acceptDrop}
      >
        <button
          type="button"
          className="w-3 cursor-pointer text-[10px] text-ink-dim hover:text-ink"
          onClick={() => openFolders.toggle(folder.id)}
          {...tooltipHandlers(assetFolderTip(folder.name, open))}
        >
          {open ? '▾' : '▸'}
        </button>
        {renaming ? (
          <AssetFolderNameInput folder={folder} onDone={() => setRenaming(false)} />
        ) : (
          <button
            type="button"
            className="min-w-0 flex-1 cursor-text truncate text-left text-xs text-ink"
            onClick={() => setRenaming(true)}
            {...tooltipHandlers(ASSET_FOLDER_NAME_TIP)}
          >
            📁 {folder.name}
          </button>
        )}
        <span className="text-[10px] text-ink-dim">{count}</span>
        <IconButton
          className={classes(REVEALED_ON_ROW_HOVER, ACTION_BUTTON_CLASSES)}
          tip={renameAssetFolderTip(folder.name)}
          onClick={() => setRenaming(true)}
        >
          ✎
        </IconButton>
        <IconButton
          className={classes(REVEALED_ON_ROW_HOVER, ACTION_BUTTON_CLASSES)}
          tip={addSubfolderTip(folder.name)}
          onClick={() => {
            if (!open) openFolders.toggle(folder.id);
            perform('add_asset_folder', {
              section: folder.section,
              name: 'new folder',
              parent_id: folder.id,
            });
          }}
        >
          +
        </IconButton>
        <IconButton
          className={classes(REVEALED_ON_ROW_HOVER, ACTION_BUTTON_CLASSES, 'hover:text-danger-ink')}
          tip={deleteAssetFolderTip(folder.name)}
          onClick={() =>
            count > 0
              ? setConfirmingDelete(true)
              : perform('remove_asset_folder', { folder_id: folder.id })
          }
        >
          <TrashIcon />
        </IconButton>
      </div>
      {open ? (
        <div
          className={classes(
            'ml-2 border-l border-panel-edge pl-1.5',
            viewMode === 'grid' &&
              'grid grid-cols-[repeat(auto-fill,minmax(76px,1fr))] gap-x-1 gap-y-1.5',
          )}
        >
          {children}
        </div>
      ) : null}
      {confirmingDelete && (
        <ConfirmModal
          {...deleteAssetFolderConfirmation(folder.name, count)}
          onConfirm={() => {
            setConfirmingDelete(false);
            perform('remove_asset_folder', { folder_id: folder.id });
          }}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </section>
  );
}

function AssetFolderNameInput({
  folder,
  onDone,
}: {
  folder: AssetFolder;
  onDone(): void;
}) {
  const { perform } = useAppRuntime();
  const [draft, setDraft] = useState(folder.name);
  const settled = useRef(false);
  function settle(abandoned: boolean): void {
    if (settled.current) return;
    settled.current = true;
    const name = draft.trim();
    if (!abandoned && name && name !== folder.name) {
      perform('rename_asset_folder', { folder_id: folder.id, name });
    }
    onDone();
  }
  return (
    <input
      type="text"
      autoFocus
      className="min-w-0 flex-1 rounded border border-panel-edge bg-bg px-1 py-[1px] text-xs text-ink"
      value={draft}
      aria-label={`rename ${folder.name}`}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => settle(false)}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === 'Enter') settle(false);
        if (event.key === 'Escape') settle(true);
      }}
      {...tooltipHandlers(ASSET_FOLDER_NAME_TIP)}
    />
  );
}

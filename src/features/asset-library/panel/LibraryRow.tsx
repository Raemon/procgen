import type { CSSProperties } from 'react';
import { classes } from '@/features/app-shell/controls/classes';
import { ROW_HOVER_GROUP } from '@/features/app-shell/controls/revealOnRowHover';
import { tooltipHandlers } from '@/features/app-shell/tooltips/tooltipHandlers';
import type { LibraryEntry } from './entries/libraryEntry';
import type { LibraryFolder } from '../librarySelection';
import { selects } from '../librarySelection';
import { startAssetDrag } from './folders/assetDragTransfer';
import { LibraryRowActions } from './LibraryRowActions';
import { LIBRARY_GRID_PREVIEW_PX, useLibraryViewMode } from './libraryViewMode';
import { useLibrarySelection } from './useLibrarySelection';

export function LibraryRow({ folder, entry }: { folder: LibraryFolder; entry: LibraryEntry }) {
  const { selection, toggle } = useLibrarySelection();
  const selected = selects(selection, folder, entry.key);
  const viewMode = useLibraryViewMode();
  if (viewMode === 'grid') {
    return (
      <LibraryGridTile
        folder={folder}
        entry={entry}
        selected={selected}
        onSelect={() => toggle(folder, entry.key)}
      />
    );
  }
  return (
    <div
      draggable
      onDragStart={(event) => startAssetDrag(event.dataTransfer, folder, entry.key)}
      className={classes(
        ROW_HOVER_GROUP,
        'mb-0.5 flex w-full items-center gap-1.5 rounded border px-1 py-1',
        selected ? 'border-accent bg-btn-active' : 'border-transparent hover:bg-field',
      )}
      {...tooltipHandlers(entry.tip)}
    >
      <button
        type="button"
        className={classes(
          'flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 text-left text-xs',
          selected ? 'text-accent' : 'text-ink',
        )}
        onClick={() => toggle(folder, entry.key)}
      >
        {entry.icon}
        {entry.rowAdornment}
        <span className="min-w-0 flex-1 truncate">{entry.name}</span>
      </button>
      <LibraryRowActions entry={entry} />
    </div>
  );
}

function LibraryGridTile({
  folder,
  entry,
  selected,
  onSelect,
}: {
  folder: LibraryFolder;
  entry: LibraryEntry;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={(event) => startAssetDrag(event.dataTransfer, folder, entry.key)}
      className={classes(
        ROW_HOVER_GROUP,
        'relative min-w-0 rounded border p-1',
        selected ? 'border-accent bg-btn-active' : 'border-transparent hover:bg-field',
      )}
      style={{ '--asset-icon-size': `${LIBRARY_GRID_PREVIEW_PX}px` } as CSSProperties}
      {...tooltipHandlers(entry.tip)}
    >
      <button
        type="button"
        className={classes(
          'flex w-full min-w-0 cursor-pointer flex-col items-center gap-1 text-left',
          selected ? 'text-accent' : 'text-ink',
        )}
        onClick={onSelect}
      >
        <span className="relative block">
          {entry.icon}
          {entry.rowAdornment ? (
            <span className="absolute bottom-px left-px flex h-5 items-center rounded-sm bg-field/90">
              {entry.rowAdornment}
            </span>
          ) : null}
        </span>
        <span className="line-clamp-1 w-full text-center text-[10px] leading-3">
          {entry.name}
        </span>
      </button>
      <span className="absolute top-1 right-1 rounded-sm bg-transparent transition-colors group-hover/row:bg-panel/90 group-hover/row:shadow-sm group-focus-within/row:bg-panel/90 group-focus-within/row:shadow-sm">
        <LibraryRowActions entry={entry} />
      </span>
    </div>
  );
}

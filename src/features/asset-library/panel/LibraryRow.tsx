import type { CSSProperties, MouseEvent } from 'react';
import { classes } from '@/features/app-shell/controls/classes';
import { ROW_HOVER_GROUP } from '@/features/app-shell/controls/revealOnRowHover';
import { tooltipHandlers } from '@/features/app-shell/tooltips/tooltipHandlers';
import type { LibraryEntry } from './entries/libraryEntry';
import type { LibraryFolder } from '../librarySelection';
import { selects } from '../librarySelection';
import { LibraryRowActions } from './LibraryRowActions';
import { LibraryRowName } from './LibraryRowName';
import { LIBRARY_GRID_PREVIEW_PX, useLibraryViewMode } from './libraryViewMode';
import { useLibrarySelection } from './useLibrarySelection';

export function LibraryRow({ folder, entry }: { folder: LibraryFolder; entry: LibraryEntry }) {
  const { selection, open } = useLibrarySelection();
  const selected = selects(selection, folder, entry.key);
  const viewMode = useLibraryViewMode();
  const openThisRow = () => open(folder, entry.key);
  if (viewMode === 'grid') {
    return <LibraryGridTile entry={entry} selected={selected} onOpen={openThisRow} />;
  }
  return (
    <div
      className={classes(
        ROW_HOVER_GROUP,
        'mb-0.5 flex w-full items-center gap-1.5 rounded border px-1 py-1',
        selected ? 'border-accent bg-btn-active' : 'border-transparent hover:bg-field',
      )}
      onClick={openThisRow}
      {...tooltipHandlers(entry.tip)}
    >
      <button
        type="button"
        aria-label={entry.name}
        className={classes(
          'flex shrink-0 cursor-pointer items-center gap-1.5 text-left text-xs',
          selected ? 'text-accent' : 'text-ink',
        )}
        onClick={stopThenOpen(openThisRow)}
      >
        {entry.icon}
        {entry.rowAdornment}
      </button>
      <LibraryRowName
        entry={entry}
        className={classes('min-w-0 flex-1 truncate text-xs', selected ? 'text-accent' : 'text-ink')}
      />
      <RowActions entry={entry} />
    </div>
  );
}

function LibraryGridTile({
  entry,
  selected,
  onOpen,
}: {
  entry: LibraryEntry;
  selected: boolean;
  onOpen: () => void;
}) {
  return (
    <div
      className={classes(
        ROW_HOVER_GROUP,
        'relative min-w-0 rounded border p-1',
        selected ? 'border-accent bg-btn-active' : 'border-transparent hover:bg-field',
      )}
      style={{ '--asset-icon-size': `${LIBRARY_GRID_PREVIEW_PX}px` } as CSSProperties}
      onClick={onOpen}
      {...tooltipHandlers(entry.tip)}
    >
      <button
        type="button"
        aria-label={entry.name}
        className={classes(
          'flex w-full min-w-0 cursor-pointer flex-col items-center gap-1 text-left',
          selected ? 'text-accent' : 'text-ink',
        )}
        onClick={stopThenOpen(onOpen)}
      >
        <span className="relative block">
          {entry.icon}
          {entry.rowAdornment ? (
            <span className="absolute bottom-px left-px flex h-5 items-center rounded-sm bg-field/90">
              {entry.rowAdornment}
            </span>
          ) : null}
        </span>
      </button>
      <LibraryRowName
        entry={entry}
        className={classes(
          'mt-1 block w-full truncate text-center text-[10px] leading-3',
          selected ? 'text-accent' : 'text-ink',
        )}
      />
      <RowActions
        entry={entry}
        className="absolute top-1 right-1 rounded-sm bg-transparent transition-colors group-hover/row:bg-panel/90 group-hover/row:shadow-sm group-focus-within/row:bg-panel/90 group-focus-within/row:shadow-sm"
      />
    </div>
  );
}

function RowActions({ entry, className }: { entry: LibraryEntry; className?: string }) {
  return (
    <span className={className} onClick={(event) => event.stopPropagation()}>
      <LibraryRowActions entry={entry} />
    </span>
  );
}

function stopThenOpen(onOpen: () => void): (event: MouseEvent<HTMLElement>) => void {
  return (event) => {
    event.stopPropagation();
    onOpen();
  };
}

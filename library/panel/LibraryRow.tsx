import { classes } from '../../frontend/controls/classes';
import { ROW_HOVER_GROUP } from '../../frontend/controls/revealOnRowHover';
import { tooltipHandlers } from '../../frontend/tooltips/tooltipHandlers';
import type { LibraryEntry } from './entries/libraryEntry';
import type { LibraryFolder } from '../librarySelection';
import { selects } from '../librarySelection';
import { LibraryRowActions } from './LibraryRowActions';
import { useLibrarySelection } from './useLibrarySelection';

export function LibraryRow({ folder, entry }: { folder: LibraryFolder; entry: LibraryEntry }) {
  const [selection, select] = useLibrarySelection();
  const selected = selects(selection, folder, entry.key);
  return (
    <div
      className={classes(
        ROW_HOVER_GROUP,
        'mb-0.5 flex w-full items-center gap-1.5 rounded border px-1 py-1',
        selected ? 'border-accent bg-btn-active' : 'border-transparent hover:bg-field',
      )}
    >
      <button
        type="button"
        className={classes(
          'flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 text-left text-xs',
          selected ? 'text-accent' : 'text-ink',
        )}
        onClick={() => select(folder, entry.key)}
        {...tooltipHandlers(entry.tip)}
      >
        {entry.icon}
        <span className="min-w-0 flex-1 truncate">{entry.name}</span>
      </button>
      <LibraryRowActions entry={entry} />
    </div>
  );
}

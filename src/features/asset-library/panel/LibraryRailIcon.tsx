import { classes } from '@/features/app-shell/controls/classes';
import { tooltipHandlers } from '@/features/app-shell/tooltips/tooltipHandlers';
import type { LibraryEntry } from './entries/libraryEntry';
import type { LibraryFolder } from '../librarySelection';
import { selects } from '../librarySelection';
import { useLibrarySelection } from './useLibrarySelection';

export function LibraryRailIcon({ folder, entry }: { folder: LibraryFolder; entry: LibraryEntry }) {
  const { selection, open } = useLibrarySelection();
  const selected = selects(selection, folder, entry.key);
  return (
    <button
      type="button"
      className={classes(
        'shrink-0 cursor-pointer rounded-sm border p-px',
        selected ? 'border-accent' : 'border-transparent',
      )}
      onClick={(event) => {
        event.stopPropagation();
        open(folder, entry.key);
      }}
      {...tooltipHandlers(entry.tip)}
    >
      {entry.icon}
    </button>
  );
}

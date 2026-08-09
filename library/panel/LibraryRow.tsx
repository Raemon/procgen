import type { ReactNode } from 'react';
import { classes } from '../../frontend/controls/classes';
import type { TooltipContent } from '../../frontend/tooltips/tooltipContent';
import { tooltipHandlers } from '../../frontend/tooltips/tooltipHandlers';
import type { LibraryFolder } from '../librarySelection';
import { selects } from '../librarySelection';
import { useLibrarySelection } from '../useLibrarySelection';

export function LibraryRow({
  folder,
  entryKey,
  name,
  glyph,
  tint,
  note,
  dimmed,
  tip,
}: {
  folder: LibraryFolder;
  entryKey: string;
  name: string;
  glyph?: ReactNode;
  tint?: string;
  note?: string;
  dimmed?: boolean;
  tip: TooltipContent;
}) {
  const [selection, select] = useLibrarySelection();
  const selected = selects(selection, folder, entryKey);
  return (
    <button
      type="button"
      className={classes(
        'flex w-full cursor-pointer items-center gap-1.5 rounded border px-1.5 py-1 text-left text-xs',
        selected ? 'border-accent bg-btn-active text-accent' : 'border-transparent text-ink hover:bg-field',
        dimmed && 'opacity-45',
      )}
      onClick={() => select(folder, entryKey)}
      {...tooltipHandlers(tip)}
    >
      {glyph && (
        <span className="flex w-4 shrink-0 justify-center" style={tint ? { color: tint } : undefined}>
          {glyph}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate">{name}</span>
      {note && <span className="shrink-0 text-[10px] text-ink-dim">{note}</span>}
    </button>
  );
}

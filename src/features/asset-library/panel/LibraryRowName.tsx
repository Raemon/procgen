import { useRef, useState } from 'react';
import { classes } from '@/features/app-shell/controls/classes';
import { tooltipHandlers } from '@/features/app-shell/tooltips/tooltipHandlers';
import { renameRowTip } from '../help/rowActionTips';
import type { LibraryEntry } from './entries/libraryEntry';

export function LibraryRowName({ entry, className }: { entry: LibraryEntry; className?: string }) {
  const [editing, setEditing] = useState(false);
  const settled = useRef(false);
  const rename = entry.rename;

  function finish(typed: string, abandoned: boolean): void {
    if (settled.current) return;
    settled.current = true;
    setEditing(false);
    const named = typed.trim();
    if (!abandoned && rename && named !== '' && named !== entry.name) rename(named);
  }

  function startEditing(): void {
    settled.current = false;
    setEditing(true);
  }

  if (editing && rename) {
    return (
      <input
        autoFocus
        type="text"
        aria-label={`rename ${entry.name}`}
        className={classes(
          className,
          'rounded-sm border border-panel-edge bg-bg px-0.5 text-ink outline-none',
        )}
        defaultValue={entry.name}
        onFocus={(event) => event.currentTarget.select()}
        onClick={(event) => event.stopPropagation()}
        onBlur={(event) => finish(event.currentTarget.value, false)}
        onKeyDown={(event) => {
          event.stopPropagation();
          if (event.key === 'Enter') finish(event.currentTarget.value, false);
          if (event.key === 'Escape') finish(event.currentTarget.value, true);
        }}
      />
    );
  }

  return (
    <span
      className={classes(
        className,
        rename && 'cursor-text decoration-dotted underline-offset-2 hover:underline',
      )}
      onClick={
        rename &&
        ((event) => {
          event.stopPropagation();
          startEditing();
        })
      }
      {...tooltipHandlers(rename ? renameRowTip(entry.name) : undefined)}
    >
      {entry.name}
    </span>
  );
}

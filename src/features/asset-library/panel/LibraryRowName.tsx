import { useRef, useState } from 'react';
import { classes } from '@/features/app-shell/controls/classes';
import { tooltipHandlers } from '@/features/app-shell/tooltips/tooltipHandlers';
import { renameRowTip } from '../help/rowActionTips';
import type { LibraryEntry } from './entries/libraryEntry';

export function LibraryRowName({ entry, className }: { entry: LibraryEntry; className?: string }) {
  const [editing, setEditing] = useState(false);
  const abandoned = useRef(false);
  const rename = entry.rename;

  function finish(typed: string): void {
    setEditing(false);
    const named = typed.trim();
    if (abandoned.current) return void (abandoned.current = false);
    if (rename && named !== '' && named !== entry.name) rename(named);
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
        onBlur={(event) => finish(event.currentTarget.value)}
        onKeyDown={(event) => {
          event.stopPropagation();
          if (event.key !== 'Enter' && event.key !== 'Escape') return;
          abandoned.current = event.key === 'Escape';
          event.currentTarget.blur();
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
          setEditing(true);
        })
      }
      {...tooltipHandlers(rename ? renameRowTip(entry.name) : undefined)}
    >
      {entry.name}
    </span>
  );
}

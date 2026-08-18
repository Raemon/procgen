import { classes } from '@/features/app-shell/controls/classes';
import { Icon } from '@/features/app-shell/icons/Icon';
import { tooltipHandlers } from '@/features/app-shell/tooltips/tooltipHandlers';
import type { LibraryViewMode } from './libraryViewMode';

export function LibraryViewModeToggle({
  mode,
  onChange,
}: {
  mode: LibraryViewMode;
  onChange: (mode: LibraryViewMode) => void;
}) {
  return (
    <span
      role="group"
      aria-label="asset library layout"
      className="flex overflow-hidden rounded border border-panel-edge bg-field"
    >
      <ModeButton mode="rows" selected={mode === 'rows'} onSelect={onChange} />
      <ModeButton mode="grid" selected={mode === 'grid'} onSelect={onChange} />
    </span>
  );
}

function ModeButton({
  mode,
  selected,
  onSelect,
}: {
  mode: LibraryViewMode;
  selected: boolean;
  onSelect: (mode: LibraryViewMode) => void;
}) {
  const label = mode === 'rows' ? 'row view' : 'large preview grid';
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      className={classes(
        'flex h-5 w-5 cursor-pointer items-center justify-center border-l border-panel-edge first:border-l-0 focus-visible:outline-1 focus-visible:outline-accent focus-visible:outline-offset-[-2px]',
        selected ? 'bg-btn-active text-accent' : 'text-ink-dim hover:bg-btn-hover hover:text-ink',
      )}
      onClick={() => onSelect(mode)}
      {...tooltipHandlers({
        title: label,
        body:
          mode === 'rows'
            ? 'Show compact asset rows with names and actions side by side.'
            : 'Show two-times-larger previews in a tile grid, with each name below its preview.',
      })}
    >
      {mode === 'rows' ? <RowsIcon /> : <GridIcon />}
    </button>
  );
}

function RowsIcon() {
  return (
    <Icon size={12}>
      <rect x="3" y="4" width="4" height="4" rx="0.5" />
      <path d="M10 6h11M10 12h11M10 18h11" />
      <rect x="3" y="10" width="4" height="4" rx="0.5" />
      <rect x="3" y="16" width="4" height="4" rx="0.5" />
    </Icon>
  );
}

function GridIcon() {
  return (
    <Icon size={12}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </Icon>
  );
}

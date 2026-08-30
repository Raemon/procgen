import { useEffect, useState } from 'react';
import { classes } from '@/features/app-shell/controls/classes';
import { FIELD_CLASSES } from '@/features/app-shell/controls/fieldClasses';
import type { TooltipContent } from '@/features/app-shell/tooltips/tooltipContent';
import { tooltipHandlers } from '@/features/app-shell/tooltips/tooltipHandlers';

export function DetailNameField({
  name,
  label,
  tip,
  onRename,
}: {
  name: string;
  label: string;
  tip: TooltipContent;
  onRename(named: string): void;
}) {
  const [typed, setTyped] = useState(name);
  useEffect(() => setTyped(name), [name]);

  function commit(): void {
    const named = typed.trim();
    if (named === '' || named === name) setTyped(name);
    else onRename(named);
  }

  return (
    <input
      type="text"
      aria-label={label}
      className={classes(FIELD_CLASSES, 'mb-2 w-full')}
      value={typed}
      onChange={(event) => setTyped(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur();
        if (event.key === 'Escape') setTyped(name);
      }}
      {...tooltipHandlers(tip)}
    />
  );
}

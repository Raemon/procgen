import type { ReactNode } from 'react';
import { classes } from '../controls/classes';
import { HINT_CLASSES } from '../controls/fieldClasses';
import { useHintsVisible } from './hintsVisibility';

export function PanelHint({ className, children }: { className?: string; children: ReactNode }) {
  const [visible] = useHintsVisible();
  if (!visible) return null;
  return <p className={classes(HINT_CLASSES, className)}>{children}</p>;
}

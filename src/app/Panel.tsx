import type { ReactNode } from 'react';
import { classes } from '../ui/controls/classes';
import { useAppRuntime } from './appRuntimeContext';

export function Panel({ className, children }: { className: string; children: ReactNode }) {
  const { flushPendingTweaks } = useAppRuntime();
  return (
    <div
      className={classes('overflow-y-auto border-r border-panel-edge p-3', className)}
      onBlur={flushPendingTweaks}
    >
      {children}
    </div>
  );
}

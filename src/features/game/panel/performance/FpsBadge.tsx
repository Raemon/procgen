import { classes } from '@/features/app-shell/controls/classes';
import { isBoolean } from '@/features/app-shell/state/persistedUiGuards';
import { PERSISTED_UI_KEYS } from '@/features/app-shell/state/persistedUiKeys';
import { usePersistedUiValue } from '@/features/app-shell/state/usePersistedUiValue';
import { tooltipHandlers } from '@/features/app-shell/tooltips/tooltipHandlers';
import { FPS_BADGE_TIP } from './help/performanceTips';
import { PerformancePanel } from './PerformancePanel';
import { useFrameStats } from './useFrameStats';

const SMOOTH_FPS = 50;
const PLAYABLE_FPS = 30;

export function FpsBadge() {
  const [open, setOpen] = usePersistedUiValue(
    PERSISTED_UI_KEYS.performancePanelOpen,
    false,
    isBoolean,
  );
  const frames = useFrameStats();
  return (
    <div className="pointer-events-none absolute right-3 bottom-3 flex flex-col items-end gap-1">
      {open && (
        <div className="pointer-events-auto">
          <PerformancePanel frames={frames} />
        </div>
      )}
      <button
        type="button"
        aria-label={FPS_BADGE_TIP.title}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={classes(
          'pointer-events-auto cursor-pointer rounded border px-2 py-0.5 font-mono text-[11px] tabular-nums',
          open ? 'border-accent bg-btn-active' : 'border-btn-edge bg-black/70 hover:bg-btn-hover',
          fpsToneClass(frames.fps),
        )}
        {...tooltipHandlers(FPS_BADGE_TIP)}
      >
        {frames.fps.toFixed(0)} fps
      </button>
    </div>
  );
}

function fpsToneClass(fps: number): string {
  if (fps >= SMOOTH_FPS) return 'text-ink';
  if (fps >= PLAYABLE_FPS) return 'text-accent';
  return 'text-danger-ink';
}

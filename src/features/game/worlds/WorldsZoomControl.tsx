import { Button } from '@/features/app-shell/controls/Button';
import { tooltipHandlers } from '@/features/app-shell/tooltips/tooltipHandlers';
import {
  DEFAULT_WORLDS_ZOOM,
  MAX_WORLDS_ZOOM,
  MIN_WORLDS_ZOOM,
  formattedWorldsZoom,
  steppedWorldsZoom,
} from './seedFamily';
import {
  WORLDS_ZOOM_IN_TIP,
  WORLDS_ZOOM_OUT_TIP,
  WORLDS_ZOOM_RESET_TIP,
  WORLDS_ZOOM_TIP,
} from './help/worldsTips';

const STEP_BUTTON = 'h-5 w-5 px-0 py-0 text-[13px] leading-none';

export function WorldsZoomControl({
  zoom,
  onZoom,
}: {
  zoom: number;
  onZoom(value: number): void;
}) {
  return (
    <span
      role="group"
      aria-label="worlds zoom"
      className="flex items-center gap-0.5"
      {...tooltipHandlers(WORLDS_ZOOM_TIP)}
    >
      <Button
        className={STEP_BUTTON}
        aria-label="zoom further out"
        tip={WORLDS_ZOOM_OUT_TIP}
        disabled={zoom <= MIN_WORLDS_ZOOM}
        onClick={() => onZoom(steppedWorldsZoom(zoom, -1))}
      >
        −
      </Button>
      <button
        type="button"
        className="w-9 cursor-pointer text-center text-[11px] tabular-nums text-ink-dim hover:text-ink"
        aria-label="reset zoom"
        onClick={() => onZoom(DEFAULT_WORLDS_ZOOM)}
        {...tooltipHandlers(WORLDS_ZOOM_RESET_TIP)}
      >
        {formattedWorldsZoom(zoom)}
      </button>
      <Button
        className={STEP_BUTTON}
        aria-label="zoom in"
        tip={WORLDS_ZOOM_IN_TIP}
        disabled={zoom >= MAX_WORLDS_ZOOM}
        onClick={() => onZoom(steppedWorldsZoom(zoom, 1))}
      >
        +
      </Button>
    </span>
  );
}

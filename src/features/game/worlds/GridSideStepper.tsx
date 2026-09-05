import { Button } from '@/features/app-shell/controls/Button';
import type { TooltipContent } from '@/features/app-shell/tooltips/tooltipContent';
import { MAX_WORLD_GRID_SIDE, MIN_WORLD_GRID_SIDE, clampedGridSide } from './seedFamily';

const STEP_BUTTON = 'h-5 w-5 px-0 py-0 text-[13px] leading-none';

export function GridSideStepper({
  label,
  value,
  tip,
  onChange,
}: {
  label: string;
  value: number;
  tip: TooltipContent;
  onChange(value: number): void;
}) {
  return (
    <span role="group" aria-label={label} className="flex items-center gap-0.5">
      <Button
        className={STEP_BUTTON}
        aria-label={`fewer ${label}`}
        tip={tip}
        disabled={value <= MIN_WORLD_GRID_SIDE}
        onClick={() => onChange(clampedGridSide(value - 1))}
      >
        −
      </Button>
      <span className="w-3 text-center text-[11px] tabular-nums text-ink">{value}</span>
      <Button
        className={STEP_BUTTON}
        aria-label={`more ${label}`}
        tip={tip}
        disabled={value >= MAX_WORLD_GRID_SIDE}
        onClick={() => onChange(clampedGridSide(value + 1))}
      >
        +
      </Button>
    </span>
  );
}

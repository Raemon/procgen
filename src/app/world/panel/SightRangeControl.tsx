import { useState } from 'react';
import { useAppRuntime } from '../../frontend/appRuntimeContext';
import {
  DEFAULT_CHARACTER_SIGHT_RADIUS_TILES,
  MAX_CHARACTER_SIGHT_RADIUS_TILES,
  MIN_CHARACTER_SIGHT_RADIUS_TILES,
} from '../vision/characterSight';
import { Slider } from '../../frontend/controls/Slider';
import { tooltipHandlers } from '../../frontend/tooltips/tooltipHandlers';
import { SIGHT_RANGE_TIP } from './help/worldTips';

export function SightRangeControl() {
  const { world, perform } = useAppRuntime();
  const [radiusTiles, setRadiusTiles] = useState(world.sightRadiusTiles);
  const setRadius = (radius: number): void => {
    perform('set_sight_radius', { radius_tiles: radius });
    setRadiusTiles(world.sightRadiusTiles);
  };
  return (
    <span className="flex items-center gap-1.5" {...tooltipHandlers(SIGHT_RANGE_TIP)}>
      <span className="text-[11px] text-ink-dim">sight</span>
      <span className="w-24">
        <Slider
          min={MIN_CHARACTER_SIGHT_RADIUS_TILES}
          max={MAX_CHARACTER_SIGHT_RADIUS_TILES}
          step={1}
          value={radiusTiles}
          onChange={setRadius}
        />
      </span>
      <button
        type="button"
        className="w-9 cursor-pointer text-left text-[11px] tabular-nums text-ink-dim hover:text-ink"
        aria-label={SIGHT_RANGE_TIP.title}
        onClick={() => setRadius(DEFAULT_CHARACTER_SIGHT_RADIUS_TILES)}
      >
        {radiusTiles}t
      </button>
    </span>
  );
}

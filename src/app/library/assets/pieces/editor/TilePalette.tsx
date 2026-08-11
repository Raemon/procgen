import { EMPTY_VOXEL } from '../pieceDef';
import type { ReadOnlyTileAssets } from '../../../frontend/readOnlyAssets';
import { classes } from '../../../frontend/controls/classes';
import type { TooltipContent } from '../../../frontend/tooltips/tooltipContent';
import { tooltipHandlers } from '../../../frontend/tooltips/tooltipHandlers';
import { EMPTY_VOXEL_TIP, paletteTileTip } from './help/pieceTips';

const SWATCH_CLASSES = 'h-5 w-5 cursor-pointer rounded-[3px] border text-[10px] leading-none';

export function TilePalette({
  tileAssets,
  tileId,
  onPick,
}: {
  tileAssets: ReadOnlyTileAssets;
  tileId: number;
  onPick(tileId: number): void;
}) {
  return (
    <div className="mt-1.5 flex max-h-16 flex-wrap gap-1 overflow-y-auto">
      <Swatch
        tip={EMPTY_VOXEL_TIP}
        color="transparent"
        selected={tileId === EMPTY_VOXEL}
        onPick={() => onPick(EMPTY_VOXEL)}
      />
      {tileAssets.all().map((tile) => (
        <Swatch
          key={tile.id}
          tip={paletteTileTip(tile.name)}
          color={tile.color}
          selected={tileId === tile.id}
          onPick={() => onPick(tile.id)}
        />
      ))}
    </div>
  );
}

function Swatch({
  tip,
  color,
  selected,
  onPick,
}: {
  tip: TooltipContent;
  color: string;
  selected: boolean;
  onPick(): void;
}) {
  return (
    <button
      type="button"
      aria-label={tip.title}
      style={{ backgroundColor: color }}
      className={classes(SWATCH_CLASSES, selected ? 'border-accent' : 'border-art-edge')}
      onClick={onPick}
      {...tooltipHandlers(tip)}
    />
  );
}

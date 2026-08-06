import { EMPTY_VOXEL } from '../../prefabs/prefabDef';
import type { Tileset } from '../../world/tiles/tileset';
import { classes } from '../controls/classes';

const SWATCH_CLASSES = 'h-5 w-5 cursor-pointer rounded-[3px] border text-[10px] leading-none';

export function TilePalette({
  tileset,
  tileId,
  onPick,
}: {
  tileset: Tileset;
  tileId: number;
  onPick(tileId: number): void;
}) {
  return (
    <div className="mt-1.5 flex max-h-16 flex-wrap gap-1 overflow-y-auto">
      <Swatch
        title="empty"
        color="transparent"
        selected={tileId === EMPTY_VOXEL}
        onPick={() => onPick(EMPTY_VOXEL)}
      />
      {tileset.all().map((tile) => (
        <Swatch
          key={tile.id}
          title={tile.name}
          color={tile.color}
          selected={tileId === tile.id}
          onPick={() => onPick(tile.id)}
        />
      ))}
    </div>
  );
}

function Swatch({
  title,
  color,
  selected,
  onPick,
}: {
  title: string;
  color: string;
  selected: boolean;
  onPick(): void;
}) {
  return (
    <button
      type="button"
      title={title}
      style={{ backgroundColor: color }}
      className={classes(SWATCH_CLASSES, selected ? 'border-accent' : 'border-art-edge')}
      onClick={onPick}
    />
  );
}

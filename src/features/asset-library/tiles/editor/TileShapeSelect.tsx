import { Select } from '@/features/app-shell/controls/Select';
import { BLOCKING_TILE_SHAPES, TILE_SHAPE_KINDS } from '../tileShapeKind';
import type { TileDef } from '../tileDef';
import { TILE_SHAPE_TIP } from './help/tileTips';

export function TileShapeSelect({
  tile,
  onPick,
}: {
  tile: TileDef;
  onPick(shape: number): void;
}) {
  const shapes = tile.walkable ? TILE_SHAPE_KINDS : BLOCKING_TILE_SHAPES;
  return (
    <Select
      options={shapes.map((shape) => ({ value: String(TILE_SHAPE_KINDS.indexOf(shape)), text: shape }))}
      value={String(TILE_SHAPE_KINDS.indexOf(tile.shape))}
      onChange={(value) => onPick(Number(value))}
      className="w-24 shrink-0"
      fullWidth={false}
      tip={TILE_SHAPE_TIP}
    />
  );
}

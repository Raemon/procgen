import { Select } from '@/features/app-shell/controls/Select';
import { TILE_SHAPE_KINDS } from '../tileShapeKind';
import type { TileDef } from '../tileDef';
import { TILE_SHAPE_TIP } from './help/tileTips';

const SHAPE_OPTIONS = TILE_SHAPE_KINDS.map((shape, index) => ({
  value: String(index),
  text: shape,
}));

export function TileShapeSelect({
  tile,
  onPick,
}: {
  tile: TileDef;
  onPick(shape: number): void;
}) {
  return (
    <Select
      options={SHAPE_OPTIONS}
      value={String(TILE_SHAPE_KINDS.indexOf(tile.shape))}
      onChange={(value) => onPick(Number(value))}
      className="w-24 shrink-0"
      fullWidth={false}
      tip={TILE_SHAPE_TIP}
    />
  );
}

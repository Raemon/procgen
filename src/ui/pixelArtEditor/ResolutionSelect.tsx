import { FACE_ART_SIZES } from '../../world/tiles/tileFaceArt';
import { Select } from '../controls/Select';
import { RESOLUTION_TIP } from './help/paintTips';

export function ResolutionSelect({
  size,
  onSelect,
}: {
  size: number;
  onSelect(size: number): void;
}) {
  return (
    <Select
      fullWidth={false}
      className="text-[11px]"
      tip={RESOLUTION_TIP}
      value={String(size)}
      options={FACE_ART_SIZES.map((option) => ({
        value: String(option),
        text: `${option}×${option}`,
      }))}
      onChange={(value) => onSelect(Number(value))}
    />
  );
}

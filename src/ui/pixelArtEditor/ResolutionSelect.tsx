import { FACE_ART_SIZES } from '../../world/tiles/tileFaceArt';
import { Select } from '../controls/Select';

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
      title="art resolution (existing art is rescaled)"
      value={String(size)}
      options={FACE_ART_SIZES.map((option) => ({
        value: String(option),
        text: `${option}×${option}`,
      }))}
      onChange={(value) => onSelect(Number(value))}
    />
  );
}

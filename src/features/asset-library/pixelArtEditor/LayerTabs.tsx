import type { ArtLayer } from '../tiles/faceArtFrames';
import { Button } from '@/features/app-shell/controls/Button';
import { LAYER_TIPS } from './help/paintTips';

const LAYERS: { layer: ArtLayer; label: string }[] = [
  { layer: 'color', label: 'colour' },
  { layer: 'height', label: 'relief' },
];

export function LayerTabs({
  layer,
  onSelect,
}: {
  layer: ArtLayer;
  onSelect(layer: ArtLayer): void;
}) {
  return (
    <div className="flex items-center gap-1">
      {LAYERS.map((option) => (
        <Button
          key={option.layer}
          className="px-2 py-0.5 text-[11px]"
          active={layer === option.layer}
          tip={LAYER_TIPS[option.layer]}
          onClick={() => onSelect(option.layer)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

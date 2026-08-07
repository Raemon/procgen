import { heightInk, heightOfInk, HEIGHT_INK_STEPS } from '../tiles/faceArtHeight';
import { IconButton } from '../../frontend/controls/IconButton';
import { Slider } from '../../frontend/controls/Slider';
import { tooltipHandlers } from '../../frontend/tooltips/tooltipHandlers';
import { heightSwatchTip, HEIGHT_SLIDER_TIP } from './help/paintTips';

const SLIDER_STEPS = 100;

export function HeightInkField({
  ink,
  onChange,
}: {
  ink: string;
  onChange(ink: string): void;
}) {
  return (
    <span className="flex items-center gap-1.5">
      {HEIGHT_INK_STEPS.map((step) => (
        <IconButton
          key={step}
          className="h-6 w-6"
          tip={heightSwatchTip(heightOfInk(step))}
          active={step === ink}
          onClick={() => onChange(step)}
        >
          <span className="block h-full w-full rounded-[2px]" style={{ backgroundColor: step }} />
        </IconButton>
      ))}
      <span
        className="flex w-[80px] items-center"
        {...tooltipHandlers(HEIGHT_SLIDER_TIP)}
      >
        <Slider
          min={0}
          max={SLIDER_STEPS}
          step={1}
          value={Math.round(heightOfInk(ink) * SLIDER_STEPS)}
          onChange={(value) => onChange(heightInk(value / SLIDER_STEPS))}
        />
      </span>
    </span>
  );
}

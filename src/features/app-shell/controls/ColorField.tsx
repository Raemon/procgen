import { isTransparentInk, opaqueInk, withTransparency } from '@/features/asset-library/tiles/inkColor';
import type { TooltipContent } from '../tooltips/tooltipContent';
import { tooltipHandlers } from '../tooltips/tooltipHandlers';
import { IconButton } from './IconButton';
import { classes } from './classes';
import { COLOR_INPUT_CLASSES } from './fieldClasses';

const CHECKER =
  'linear-gradient(45deg, #2b2b2b 25%, transparent 25%, transparent 75%, #2b2b2b 75%)';

const TRANSPARENT_SWATCH = {
  backgroundImage: `${CHECKER}, ${CHECKER}`,
  backgroundSize: '8px 8px',
  backgroundPosition: '0 0, 4px 4px',
  backgroundColor: '#1e1e1e',
};

export function ColorField({
  ink,
  tip,
  onChange,
}: {
  ink: string;
  tip: TooltipContent;
  onChange(ink: string): void;
}) {
  const transparent = isTransparentInk(ink);
  return (
    <span className="inline-flex items-center gap-1">
      <input
        type="color"
        aria-label={tip.title}
        className={classes(COLOR_INPUT_CLASSES, transparent ? 'opacity-40' : '')}
        value={opaqueInk(ink)}
        onChange={(event) => onChange(event.target.value)}
        {...tooltipHandlers(tip)}
      />
      <IconButton
        className="h-6 w-6"
        tip={transparencyTip(transparent)}
        active={transparent}
        onClick={() => onChange(withTransparency(ink, !transparent))}
      >
        <span className="block h-full w-full rounded-[2px]" style={TRANSPARENT_SWATCH} />
      </IconButton>
    </span>
  );
}

function transparencyTip(transparent: boolean): TooltipContent {
  return {
    title: transparent ? 'transparent' : 'solid colour',
    body: transparent
      ? 'Nothing is drawn here — whatever sits behind shows through. Click for a solid colour again.'
      : 'Click to make this colour transparent, so it paints holes rather than pixels.',
  };
}

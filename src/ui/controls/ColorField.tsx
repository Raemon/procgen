import { isTransparentInk, opaqueInk, withTransparency } from '../../world/tiles/inkColor';
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
  title,
  onChange,
}: {
  ink: string;
  title: string;
  onChange(ink: string): void;
}) {
  const transparent = isTransparentInk(ink);
  return (
    <span className="inline-flex items-center gap-1">
      <input
        type="color"
        className={classes(COLOR_INPUT_CLASSES, transparent ? 'opacity-40' : '')}
        title={title}
        value={opaqueInk(ink)}
        onChange={(event) => onChange(event.target.value)}
      />
      <IconButton
        className="h-6 w-6"
        title={transparent ? 'transparent — click for solid color' : 'click for transparent'}
        active={transparent}
        onClick={() => onChange(withTransparency(ink, !transparent))}
      >
        <span className="block h-full w-full rounded-[2px]" style={TRANSPARENT_SWATCH} />
      </IconButton>
    </span>
  );
}

import { classes } from '../controls/classes';
import { HelpIcon } from '../icons/panelIcons';
import { useHintsVisible } from './hintsVisibility';

export function HintsToggle() {
  const [visible, setVisible] = useHintsVisible();
  return (
    <button
      type="button"
      aria-pressed={visible}
      title={visible ? 'hide the explanatory notes' : 'show the explanatory notes'}
      className={classes(
        'cursor-pointer rounded border border-transparent p-0.5 hover:border-panel-edge hover:text-ink',
        visible ? 'text-accent' : 'text-ink-dim',
      )}
      onClick={() => setVisible(!visible)}
    >
      <HelpIcon />
    </button>
  );
}

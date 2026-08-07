import { classes } from '../controls/classes';
import { HelpIcon } from '../icons/panelIcons';
import { tooltipHandlers } from '../tooltips/tooltipHandlers';
import { useHintsVisible } from './hintsVisibility';

export function HintsToggle() {
  const [visible, setVisible] = useHintsVisible();
  return (
    <button
      type="button"
      aria-pressed={visible}
      aria-label="explanatory notes"
      className={classes(
        'cursor-pointer rounded border border-transparent p-0.5 hover:border-panel-edge hover:text-ink',
        visible ? 'text-accent' : 'text-ink-dim',
      )}
      onClick={() => setVisible(!visible)}
      {...tooltipHandlers({
        title: 'explanatory notes',
        body: visible
          ? 'Notes are showing at the foot of each panel. Click to fold them away again.'
          : 'Every panel keeps a paragraph explaining what it is for. Click to show them; hovering any control explains that control on its own.',
      })}
    >
      <HelpIcon />
    </button>
  );
}

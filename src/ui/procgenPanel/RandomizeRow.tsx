import { useAppRuntime } from '../../app/appRuntimeContext';
import { Button } from '../controls/Button';
import type { TooltipContent } from '../tooltips/tooltipContent';
import { RANDOMIZE_TIPS } from './help/pipelineTips';

const ROLLS: { action: string; label: string; tip: TooltipContent }[] = [
  { action: 'randomize_world', label: '🎲 world', tip: RANDOMIZE_TIPS.world },
  { action: 'randomize_sliders', label: '~ sliders', tip: RANDOMIZE_TIPS.sliders },
  { action: 'randomize_nodes', label: '⇄ nodes', tip: RANDOMIZE_TIPS.nodes },
  { action: 'undo_randomize', label: 'undo', tip: RANDOMIZE_TIPS.undo },
];

export function RandomizeRow() {
  const { perform } = useAppRuntime();
  return (
    <div className="mb-2 flex gap-1.5">
      {ROLLS.map((roll) => (
        <Button
          key={roll.action}
          className="flex-1 whitespace-nowrap"
          tip={roll.tip}
          onClick={() => perform(roll.action)}
        >
          {roll.label}
        </Button>
      ))}
    </div>
  );
}

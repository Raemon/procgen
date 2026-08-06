import { useAppRuntime } from '../../app/appRuntimeContext';
import { Button } from '../controls/Button';

const ROLLS = [
  {
    action: 'randomize_world',
    label: '🎲 world',
    title: 'replace the pipeline with a freshly rolled node combination',
  },
  {
    action: 'randomize_sliders',
    label: '~ sliders',
    title: 'nudge every numeric parameter of the current nodes',
  },
  {
    action: 'randomize_nodes',
    label: '⇄ nodes',
    title: 'mutate the node combination: swap, add, remove or rewire a node or two',
  },
] as const;

export function RandomizeRow() {
  const { perform } = useAppRuntime();
  return (
    <div className="mb-2 flex gap-1.5">
      {ROLLS.map((roll) => (
        <RollButton key={roll.action} title={roll.title} onClick={() => perform(roll.action)}>
          {roll.label}
        </RollButton>
      ))}
      <RollButton
        title="restore the pipeline from before the last roll"
        onClick={() => perform('undo_randomize')}
      >
        undo
      </RollButton>
    </div>
  );
}

function RollButton({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick(): void;
  children: string;
}) {
  return (
    <Button className="flex-1 whitespace-nowrap" title={title} onClick={onClick}>
      {children}
    </Button>
  );
}

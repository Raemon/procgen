import { useAppRuntime } from '../../app/appRuntimeContext';
import { BEHAVIOR_CHOICES } from '../../creatures/behaviorKinds';
import type { CreatureDef } from '../../creatures/creatureDef';
import { KnobRow } from '../controls/KnobRow';
import { Select } from '../controls/Select';
import { Slider } from '../controls/Slider';
import { ValueReadout } from '../controls/ValueReadout';
import type { TooltipContent } from '../tooltips/tooltipContent';

interface MotionKnob {
  field: 'speed' | 'sight' | 'roam' | 'size';
  label: string;
  min: number;
  max: number;
  step: number;
  help: string;
}

const MOTION_KNOBS: readonly MotionKnob[] = [
  { field: 'speed', label: 'speed', min: 0, max: 8, step: 0.1, help: 'Tiles per second while moving.' },
  {
    field: 'sight',
    label: 'sight',
    min: 0,
    max: 32,
    step: 1,
    help: 'How far it notices the player, in tiles. Chase, flee and guard use it; idle and wander ignore it.',
  },
  {
    field: 'roam',
    label: 'roam',
    min: 0,
    max: 32,
    step: 1,
    help: 'How far from its spawn cell it will stray — the wander radius, the patrol half-length, and the leash a guard returns to.',
  },
  {
    field: 'size',
    label: 'size',
    min: 0.2,
    max: 2,
    step: 0.05,
    help: 'Cube size in the 2.5D view. ASCII always draws one glyph per cell.',
  },
];

export function CreatureBehaviorKnobs({ creature }: { creature: CreatureDef }) {
  const { perform } = useAppRuntime();
  const setKnob = (patch: Record<string, number>) =>
    perform('update_creature', { creature_id: creature.id, ...patch });
  return (
    <div className="mt-1.5 rounded border border-art-edge bg-art-panel p-2">
      <KnobRow label="behavior" tip={behaviorTooltip()}>
        <Select
          value={String(creature.behavior)}
          options={BEHAVIOR_CHOICES.map((choice) => ({
            value: String(choice.value),
            text: choice.label,
          }))}
          onChange={(value) => setKnob({ behavior: Number(value) })}
        />
      </KnobRow>
      {MOTION_KNOBS.map((knob) => (
        <KnobRow key={knob.field} label={knob.label} tip={{ title: knob.label, body: knob.help }}>
          <Slider
            min={knob.min}
            max={knob.max}
            step={knob.step}
            value={creature[knob.field]}
            onChange={(value) => setKnob({ [knob.field]: value })}
          />
          <ValueReadout value={creature[knob.field]} />
        </KnobRow>
      ))}
      <KnobRow
        label="phasing"
        tip={{
          title: 'phasing',
          body: 'On, the creature walks through walls and water. Off, it is blocked by anything the player cannot walk on.',
        }}
      >
        <input
          type="checkbox"
          className="justify-self-start accent-accent"
          checked={creature.phasing === 1}
          onChange={(event) => setKnob({ phasing: event.target.checked ? 1 : 0 })}
        />
      </KnobRow>
    </div>
  );
}

function behaviorTooltip(): TooltipContent {
  return {
    title: 'behavior',
    body: 'What the creature does once it spawns. Every behavior stays anchored to its spawn cell through the roam radius.',
    options: BEHAVIOR_CHOICES.map((choice) => ({ name: choice.label, meaning: choice.help })),
  };
}

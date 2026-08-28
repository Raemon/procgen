import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import { BEHAVIOR_CHOICES } from '../behaviorKinds';
import type { CreatureDef } from '../creatureDef';
import { DrawerPanel } from '@/features/app-shell/controls/DrawerPanel';
import { KnobRow } from '@/features/app-shell/controls/KnobRow';
import { Select } from '@/features/app-shell/controls/Select';
import { Slider } from '@/features/app-shell/controls/Slider';
import { ValueReadout } from '@/features/app-shell/controls/ValueReadout';
import type { TooltipContent } from '@/features/app-shell/tooltips/tooltipContent';

interface MotionKnob {
  field:
    | 'speed'
    | 'sight'
    | 'roam'
    | 'bodyWidth'
    | 'bodyHeight'
    | 'maxHp'
    | 'attackDamage'
    | 'attackReach'
    | 'attackCooldown';
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
    field: 'bodyWidth',
    label: 'body width',
    min: 0.2,
    max: 4,
    step: 0.05,
    help: 'How wide the body is, in tiles, in the 2.5D view. ASCII always draws one glyph per cell.',
  },
  {
    field: 'bodyHeight',
    label: 'body height',
    min: 0.2,
    max: 4,
    step: 0.05,
    help: 'How tall the body is, in tiles. Characters default to 2 so they stand as tall as a blocking tile. A billboard sprite is scaled uniformly to fill the body box, so it is never squashed.',
  },
  {
    field: 'maxHp',
    label: 'max hp',
    min: 1,
    max: 50,
    step: 1,
    help: 'How much damage it takes before it dies. A slain spawn stays dead in this world.',
  },
  {
    field: 'attackDamage',
    label: 'attack damage',
    min: 0,
    max: 20,
    step: 1,
    help: 'How hard it hits when it attacks. At 0 it never attacks, whatever its behavior.',
  },
  {
    field: 'attackReach',
    label: 'attack reach',
    min: 0.5,
    max: 8,
    step: 0.1,
    help: 'How close, in tiles, it must be to land a hit.',
  },
  {
    field: 'attackCooldown',
    label: 'attack cooldown',
    min: 0.2,
    max: 10,
    step: 0.1,
    help: 'Seconds between its attacks.',
  },
];

export function CreatureBehaviorKnobs({ creature }: { creature: CreatureDef }) {
  const { perform } = useAppRuntime();
  const setKnob = (patch: Record<string, number>) =>
    perform('update_creature', { creature_id: creature.id, ...patch });
  return (
    <DrawerPanel>
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
    </DrawerPanel>
  );
}

function behaviorTooltip(): TooltipContent {
  return {
    title: 'behavior',
    body: 'What the creature does once it spawns. Every behavior stays anchored to its spawn cell through the roam radius.',
    options: BEHAVIOR_CHOICES.map((choice) => ({ name: choice.label, meaning: choice.help })),
  };
}

import { useAppRuntime } from '../../app/appRuntimeContext';
import {
  BILLBOARD,
  MAX_ITEM_GRID_SIDE,
  ORIENTATION_CHOICES,
  RENDER_CHOICES,
  type ItemDef,
} from '../../items/itemDef';
import { KnobRow } from '../controls/KnobRow';
import { Select } from '../controls/Select';
import { Slider } from '../controls/Slider';
import { TagsInput } from '../controls/TagsInput';
import { ValueReadout } from '../controls/ValueReadout';
import { ColorField } from '../controls/ColorField';
import type { TooltipContent } from '../tooltips/tooltipContent';

interface SizeKnob {
  field: 'size' | 'hover' | 'thickness';
  param: string;
  label: string;
  min: number;
  max: number;
  step: number;
  help: string;
}

const SIZE_KNOBS: readonly SizeKnob[] = [
  {
    field: 'size',
    param: 'size',
    label: 'size',
    min: 0.1,
    max: 2,
    step: 0.05,
    help: 'How large the item is drawn in the world, in tiles.',
  },
  {
    field: 'hover',
    param: 'hover',
    label: 'float',
    min: 0,
    max: 2,
    step: 0.05,
    help: 'How far above the ground the item floats.',
  },
  {
    field: 'thickness',
    param: 'thickness',
    label: 'thickness',
    min: 0.02,
    max: 0.5,
    step: 0.01,
    help: 'Billboard only: how far the sprite is extruded. The rim that thickness exposes is painted with the edge color.',
  },
];

export function ItemRenderKnobs({ item }: { item: ItemDef }) {
  const { perform } = useAppRuntime();
  const edit = (patch: Record<string, unknown>) => perform('update_item', { item_id: item.id, ...patch });
  const isBillboard = item.render === BILLBOARD;
  return (
    <div className="mt-1.5 rounded border border-art-edge bg-art-panel p-2">
      <KnobRow label="render" tooltip={choiceTooltip('render', RENDER_CHOICES)}>
        <Select
          value={String(item.render)}
          options={choiceOptions(RENDER_CHOICES)}
          onChange={(value) => edit({ render: Number(value) })}
        />
      </KnobRow>
      {isBillboard && (
        <>
          <KnobRow label="orientation" tooltip={choiceTooltip('orientation', ORIENTATION_CHOICES)}>
            <Select
              value={String(item.orientation)}
              options={choiceOptions(ORIENTATION_CHOICES)}
              onChange={(value) => edit({ orientation: Number(value) })}
            />
          </KnobRow>
          <KnobRow
            label="edge"
            tooltip={{
              title: 'edge color',
              body: 'The colour of the extruded rim — the part of a billboard you see from the side.',
            }}
          >
            <ColorField
              ink={item.edgeColor}
              title="edge color"
              onChange={(edgeColor) => edit({ edge_color: edgeColor })}
            />
          </KnobRow>
        </>
      )}
      {SIZE_KNOBS.filter((knob) => isBillboard || knob.field !== 'thickness').map((knob) => (
        <KnobRow key={knob.field} label={knob.label} tooltip={{ title: knob.label, body: knob.help }}>
          <Slider
            min={knob.min}
            max={knob.max}
            step={knob.step}
            value={item[knob.field]}
            onChange={(value) => edit({ [knob.param]: value })}
          />
          <ValueReadout value={item[knob.field]} />
        </KnobRow>
      ))}
      <KnobRow label="cells" tooltip={footprintTooltip()}>
        <div className="flex items-center gap-1.5">
          <FootprintSelect
            value={item.gridWidth}
            title="inventory columns"
            onChange={(gridWidth) => edit({ grid_width: gridWidth })}
          />
          <span className="text-ink-dim">×</span>
          <FootprintSelect
            value={item.gridHeight}
            title="inventory rows"
            onChange={(gridHeight) => edit({ grid_height: gridHeight })}
          />
        </div>
      </KnobRow>
      <KnobRow label="tags" tooltip={tagsTooltip()}>
        <TagsInput
          tags={item.tags}
          title="tags that decide which inventory slots accept this item"
          onChange={(tags) => edit({ tags })}
        />
      </KnobRow>
    </div>
  );
}

function FootprintSelect({
  value,
  title,
  onChange,
}: {
  value: number;
  title: string;
  onChange(value: number): void;
}) {
  return (
    <Select
      fullWidth={false}
      title={title}
      value={String(value)}
      options={Array.from({ length: MAX_ITEM_GRID_SIDE }, (_, index) => ({
        value: String(index + 1),
        text: String(index + 1),
      }))}
      onChange={(next) => onChange(Number(next))}
    />
  );
}

function choiceOptions(choices: readonly { value: number; label: string }[]) {
  return choices.map((choice) => ({ value: String(choice.value), text: choice.label }));
}

function choiceTooltip(
  title: string,
  choices: readonly { label: string; help: string }[],
): TooltipContent {
  return {
    title,
    body: 'How this item is built out of its pixel art.',
    options: choices.map((choice) => ({ name: choice.label, meaning: choice.help })),
  };
}

function footprintTooltip(): TooltipContent {
  return {
    title: 'inventory cells',
    body: 'How much room the item takes in an inventory grid, Diablo style: 1×1 for trinkets, 1×2 for a sword, 2×2 for a shield. Any size up to 8×8 works.',
  };
}

function tagsTooltip(): TooltipContent {
  return {
    title: 'tags',
    body: 'Free-form labels. An inventory slot with no tags accepts anything; a tagged slot only accepts items that carry one of its tags.',
  };
}

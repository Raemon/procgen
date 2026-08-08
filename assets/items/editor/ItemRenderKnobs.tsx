import { useAppRuntime } from '../../../frontend/appRuntimeContext';
import {
  BILLBOARD,
  MAX_ITEM_GRID_SIDE,
  ORIENTATION_CHOICES,
  RENDER_CHOICES,
  type ItemDef,
} from '../itemDef';
import { KnobRow } from '../../../frontend/controls/KnobRow';
import { Select } from '../../../frontend/controls/Select';
import { Slider } from '../../../frontend/controls/Slider';
import { TagsInput } from '../../../frontend/controls/TagsInput';
import { ValueReadout } from '../../../frontend/controls/ValueReadout';
import { ColorField } from '../../../frontend/controls/ColorField';
import { LightKnobRows } from '../../../world/light/editor/LightKnobRows';
import type { TooltipContent } from '../../../frontend/tooltips/tooltipContent';
import {
  ITEM_EDGE_COLOR_TIP,
  ITEM_GRID_TIPS,
  ITEM_TAGS_TIP,
} from './help/itemTips';

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
    help: 'Billboard only: how far the sprite is extruded. The rim that thickness exposes traces the sprite outline.',
  },
];

export function ItemRenderKnobs({ item }: { item: ItemDef }) {
  const { perform } = useAppRuntime();
  const edit = (patch: Record<string, unknown>) => perform('update_item', { item_id: item.id, ...patch });
  const isBillboard = item.render === BILLBOARD;
  return (
    <div className="mt-1.5 rounded border border-art-edge bg-art-panel p-2">
      <KnobRow label="render" tip={choiceTooltip('render', RENDER_CHOICES)}>
        <Select
          value={String(item.render)}
          options={choiceOptions(RENDER_CHOICES)}
          onChange={(value) => edit({ render: Number(value) })}
        />
      </KnobRow>
      {isBillboard && (
        <>
          <KnobRow label="orientation" tip={choiceTooltip('orientation', ORIENTATION_CHOICES)}>
            <Select
              value={String(item.orientation)}
              options={choiceOptions(ORIENTATION_CHOICES)}
              onChange={(value) => edit({ orientation: Number(value) })}
            />
          </KnobRow>
          <KnobRow
            label="edge"
            tip={{
              title: 'edge color',
              body: 'The colour of the extruded rim on a sprite-less billboard. A sprite extrudes its own outline instead.',
            }}
          >
            <ColorField
              ink={item.edgeColor}
              tip={ITEM_EDGE_COLOR_TIP}
              onChange={(edgeColor) => edit({ edge_color: edgeColor })}
            />
          </KnobRow>
        </>
      )}
      {SIZE_KNOBS.filter((knob) => isBillboard || knob.field !== 'thickness').map((knob) => (
        <KnobRow key={knob.field} label={knob.label} tip={{ title: knob.label, body: knob.help }}>
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
      <KnobRow label="cells" tip={footprintTooltip()}>
        <div className="flex items-center gap-1.5">
          <FootprintSelect
            value={item.gridWidth}
            tip={ITEM_GRID_TIPS.columns}
            onChange={(gridWidth) => edit({ grid_width: gridWidth })}
          />
          <span className="text-ink-dim">×</span>
          <FootprintSelect
            value={item.gridHeight}
            tip={ITEM_GRID_TIPS.rows}
            onChange={(gridHeight) => edit({ grid_height: gridHeight })}
          />
        </div>
      </KnobRow>
      <LightKnobRows emitter={item} onChange={edit} />
      <KnobRow label="tags" tip={tagsTooltip()}>
        <TagsInput
          tags={item.tags}
          tip={ITEM_TAGS_TIP}
          onChange={(tags) => edit({ tags })}
        />
      </KnobRow>
    </div>
  );
}

function FootprintSelect({
  value,
  tip,
  onChange,
}: {
  value: number;
  tip: TooltipContent;
  onChange(value: number): void;
}) {
  return (
    <Select
      fullWidth={false}
      tip={tip}
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

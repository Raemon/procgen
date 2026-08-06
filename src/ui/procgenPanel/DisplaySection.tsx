import { useAppRuntime } from '../../app/appRuntimeContext';
import {
  useRerenderOnCreatureChange,
  useRerenderOnPrefabChange,
} from '../../app/rerenderHooks';
import {
  displayModesForKind,
  RANDOM_ROTATION,
  type DisplayBinding,
} from '../../procgen/display/displayBinding';
import type { MarkerBinding } from '../../procgen/display/markerAppearance';
import type { NodeInstance } from '../../procgen/pipeline/pipelineState';
import type { ValueKind } from '../../procgen/values/chunkValues';
import { classes } from '../controls/classes';
import { COLOR_INPUT_CLASSES, FIELD_CLASSES } from '../controls/fieldClasses';
import { KnobRow } from '../controls/KnobRow';
import { Select } from '../controls/Select';
import { Slider } from '../controls/Slider';
import { ValueReadout } from '../controls/ValueReadout';
import {
  displayModeTooltip,
  markerTileTooltip,
  prefabRotationTooltip,
  MODE_LABELS,
} from './help/displayModeHelp';
import { tileSelectOptions } from './tileSelectOptions';

const ROTATION_OPTIONS = [
  { value: String(RANDOM_ROTATION), text: 'random' },
  { value: '0', text: '0°' },
  { value: '1', text: '90°' },
  { value: '2', text: '180°' },
  { value: '3', text: '270°' },
];

export function DisplaySection({ node, kind }: { node: NodeInstance; kind: ValueKind }) {
  const { perform } = useAppRuntime();
  return (
    <div className="mt-2 border-t border-dashed border-panel-edge pt-2">
      <KnobRow label="display" tooltip={displayModeTooltip(kind)}>
        <Select
          value={node.display.mode}
          options={displayModesForKind(kind).map((mode) => ({
            value: mode,
            text: MODE_LABELS[mode],
          }))}
          onChange={(mode) => perform('set_display', { node_id: node.id, display: mode })}
        />
      </KnobRow>
      {node.display.mode === 'elevation' && (
        <HeightScaleRow node={node} heightScale={node.display.heightScale} />
      )}
      {node.display.mode === 'markers' && <MarkerRows node={node} binding={node.display} />}
      {node.display.mode === 'prefabs' && <PrefabRows node={node} binding={node.display} />}
      {node.display.mode === 'creatures' && <CreatureRows node={node} binding={node.display} />}
    </div>
  );
}

function PrefabRows({
  node,
  binding,
}: {
  node: NodeInstance;
  binding: Extract<DisplayBinding, { mode: 'prefabs' }>;
}) {
  const { perform, prefabs } = useAppRuntime();
  useRerenderOnPrefabChange();
  return (
    <>
      <KnobRow label="prefab">
        <Select
          value={String(binding.prefabId)}
          options={libraryOptions('(none)', prefabs.all())}
          onChange={(value) => perform('set_display', { node_id: node.id, display: 'prefabs', prefab_id: Number(value) })}
        />
      </KnobRow>
      <KnobRow label="rotation" tooltip={prefabRotationTooltip()}>
        <Select
          value={String(binding.rotation)}
          options={ROTATION_OPTIONS}
          onChange={(value) => perform('set_display', { node_id: node.id, display: 'prefabs', rotation: Number(value) })}
        />
      </KnobRow>
    </>
  );
}

function CreatureRows({
  node,
  binding,
}: {
  node: NodeInstance;
  binding: Extract<DisplayBinding, { mode: 'creatures' }>;
}) {
  const { perform, creatures } = useAppRuntime();
  useRerenderOnCreatureChange();
  return (
    <KnobRow label="creature">
      <Select
        value={String(binding.creatureId)}
        options={libraryOptions('(none)', creatures.all())}
        onChange={(value) => perform('set_display', { node_id: node.id, display: 'creatures', creature_id: Number(value) })}
      />
    </KnobRow>
  );
}

function libraryOptions(
  noneText: string,
  entries: readonly { id: number; name: string }[],
): { value: string; text: string }[] {
  return [
    { value: '-1', text: noneText },
    ...entries.map((entry) => ({ value: String(entry.id), text: entry.name })),
  ];
}

function HeightScaleRow({ node, heightScale }: { node: NodeInstance; heightScale: number }) {
  const { perform } = useAppRuntime();
  return (
    <KnobRow label="height">
      <Slider
        min={0}
        max={10}
        step={0.1}
        value={heightScale}
        onChange={(value) => perform('set_display', { node_id: node.id, display: 'elevation', height_scale: value })}
      />
      <ValueReadout value={heightScale} />
    </KnobRow>
  );
}

function MarkerRows({ node, binding }: { node: NodeInstance; binding: MarkerBinding }) {
  const { perform, tileset } = useAppRuntime();
  return (
    <>
      <KnobRow label="tile" tooltip={markerTileTooltip()}>
        <Select
          value={String(binding.tileId)}
          options={tileSelectOptions(tileset, '(custom glyph)')}
          onChange={(value) => perform('set_display', { node_id: node.id, display: 'markers', tile_id: Number(value) })}
        />
      </KnobRow>
      {binding.tileId < 0 && (
        <>
          <KnobRow label="glyph">
            <input
              type="text"
              maxLength={2}
              className={classes(FIELD_CLASSES, 'w-11 justify-self-start text-center')}
              value={binding.glyph}
              onChange={(event) =>
                event.target.value && perform('set_display', { node_id: node.id, display: 'markers', glyph: event.target.value })
              }
            />
          </KnobRow>
          <KnobRow label="color">
            <input
              type="color"
              className={COLOR_INPUT_CLASSES}
              value={binding.color}
              onChange={(event) => perform('set_display', { node_id: node.id, display: 'markers', color: event.target.value })}
            />
          </KnobRow>
        </>
      )}
    </>
  );
}

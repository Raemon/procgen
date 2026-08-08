import { useAppRuntime } from '../../frontend/appRuntimeContext';
import {
  useRerenderOnCreatureChange,
  useRerenderOnItemChange,
  useRerenderOnPieceChange,
} from '../../frontend/rerenderHooks';
import {
  displayModesForKind,
  MAX_CEILING_HEIGHT,
  NO_CULTURE,
  RANDOM_ROTATION,
  type DisplayBinding,
} from '../display/displayBinding';
import type { MarkerBinding } from '../display/markerAppearance';
import type { NodeInstance } from '../pipeline/pipelineState';
import type { ValueKind } from '../values/chunkValues';
import { classes } from '../../frontend/controls/classes';
import { ColorField } from '../../frontend/controls/ColorField';
import { FIELD_CLASSES } from '../../frontend/controls/fieldClasses';
import { KnobRow } from '../../frontend/controls/KnobRow';
import { Select } from '../../frontend/controls/Select';
import { Slider } from '../../frontend/controls/Slider';
import { ValueReadout } from '../../frontend/controls/ValueReadout';
import {
  ceilingHeightTooltip,
  displayModeTooltip,
  markerTileTooltip,
  pieceRotationTooltip,
  MODE_LABELS,
} from './help/displayModeHelp';
import { tileSelectOptions } from './tileSelectOptions';

const MAX_CULTURE_ID = 15;

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
      <KnobRow label="display" tip={displayModeTooltip(kind)}>
        <Select
          value={node.display.mode}
          options={displayModesForKind(kind).map((mode) => ({
            value: mode,
            text: MODE_LABELS[mode],
          }))}
          onChange={(mode) => perform('set_display', { node_id: node.id, display: mode })}
        />
      </KnobRow>
      {node.display.mode === 'ceiling' && (
        <CeilingHeightRow node={node} height={node.display.height} />
      )}
      {node.display.mode === 'elevation' && (
        <HeightScaleRow node={node} heightScale={node.display.heightScale} />
      )}
      {node.display.mode === 'markers' && <MarkerRows node={node} binding={node.display} />}
      {node.display.mode === 'pieces' && <PieceRows node={node} binding={node.display} />}
      {node.display.mode === 'structures' && <StructureRows node={node} binding={node.display} />}
      {node.display.mode === 'creatures' && <CreatureRows node={node} binding={node.display} />}
      {node.display.mode === 'items' && <ItemRows node={node} binding={node.display} />}
    </div>
  );
}

function PieceRows({
  node,
  binding,
}: {
  node: NodeInstance;
  binding: Extract<DisplayBinding, { mode: 'pieces' }>;
}) {
  const { perform, pieces } = useAppRuntime();
  useRerenderOnPieceChange();
  return (
    <>
      <KnobRow label="piece">
        <Select
          value={String(binding.pieceId)}
          options={assetOptions('(none)', pieces.all())}
          onChange={(value) => perform('set_display', { node_id: node.id, display: 'pieces', piece_id: Number(value) })}
        />
      </KnobRow>
      <KnobRow label="rotation" tip={pieceRotationTooltip()}>
        <Select
          value={String(binding.rotation)}
          options={ROTATION_OPTIONS}
          onChange={(value) => perform('set_display', { node_id: node.id, display: 'pieces', rotation: Number(value) })}
        />
      </KnobRow>
    </>
  );
}

function StructureRows({
  node,
  binding,
}: {
  node: NodeInstance;
  binding: Extract<DisplayBinding, { mode: 'structures' }>;
}) {
  const { perform } = useAppRuntime();
  return (
    <KnobRow label="culture">
      <Slider
        min={NO_CULTURE}
        max={MAX_CULTURE_ID}
        step={1}
        value={binding.cultureId}
        onChange={(value) => perform('set_display', { node_id: node.id, display: 'structures', culture_id: value })}
      />
      <ValueReadout value={binding.cultureId} />
    </KnobRow>
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
        options={assetOptions('(none)', creatures.all())}
        onChange={(value) => perform('set_display', { node_id: node.id, display: 'creatures', creature_id: Number(value) })}
      />
    </KnobRow>
  );
}

function ItemRows({
  node,
  binding,
}: {
  node: NodeInstance;
  binding: Extract<DisplayBinding, { mode: 'items' }>;
}) {
  const { perform, items } = useAppRuntime();
  useRerenderOnItemChange();
  return (
    <KnobRow label="item">
      <Select
        value={String(binding.itemId)}
        options={assetOptions('(none)', items.all())}
        onChange={(value) => perform('set_display', { node_id: node.id, display: 'items', item_id: Number(value) })}
      />
    </KnobRow>
  );
}

function assetOptions(
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

function CeilingHeightRow({ node, height }: { node: NodeInstance; height: number }) {
  const { perform } = useAppRuntime();
  return (
    <KnobRow label="height" tip={ceilingHeightTooltip()}>
      <Slider
        min={1}
        max={MAX_CEILING_HEIGHT}
        step={1}
        value={height}
        onChange={(value) => perform('set_display', { node_id: node.id, display: 'ceiling', ceiling_height: value })}
      />
      <ValueReadout value={height} />
    </KnobRow>
  );
}

function MarkerRows({ node, binding }: { node: NodeInstance; binding: MarkerBinding }) {
  const { perform, tileAssets } = useAppRuntime();
  return (
    <>
      <KnobRow label="tile" tip={markerTileTooltip()}>
        <Select
          value={String(binding.tileId)}
          options={tileSelectOptions(tileAssets, '(custom glyph)')}
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
            <ColorField
              ink={binding.color}
              tip={{
                title: 'marker colour',
                body: "The ink the custom glyph is drawn in, everywhere this node's markers appear.",
              }}
              onChange={(color) => perform('set_display', { node_id: node.id, display: 'markers', color })}
            />
          </KnobRow>
        </>
      )}
    </>
  );
}

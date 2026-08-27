import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import { useEditedPipeline } from './editing/editedPipelineContext';
import {
  useRerenderOnCreatureChange,
  useRerenderOnItemChange,
  useRerenderOnPieceChange,
} from '@/features/app-shell/runtime/rerenderHooks';
import {
  displayModesForKind,
  MAX_CEILING_HEIGHT,
  NO_CULTURE,
  RANDOM_ROTATION,
  type DisplayBinding,
} from '@/features/asset-library/worlds/display/displayBinding';
import type { MarkerBinding } from '@/features/asset-library/worlds/display/markerAppearance';
import { nodeTypeOf } from '@/features/asset-library/worlds/nodeRegistry';
import { outputSemanticOf, type FieldSemantic } from '@/features/asset-library/worlds/nodeType';
import type { NodeInstance } from '@/features/asset-library/worlds/pipeline/pipelineState';
import type { ValueKind } from '@/features/asset-library/worlds/values/chunkValues';
import { classes } from '@/features/app-shell/controls/classes';
import { ColorField } from '@/features/app-shell/controls/ColorField';
import { FIELD_CLASSES } from '@/features/app-shell/controls/fieldClasses';
import { KnobRow } from '@/features/app-shell/controls/KnobRow';
import { Select } from '@/features/app-shell/controls/Select';
import { Slider } from '@/features/app-shell/controls/Slider';
import { ValueReadout } from '@/features/app-shell/controls/ValueReadout';
import {
  ceilingHeightTooltip,
  displayModeTooltip,
  markerTileTooltip,
  pieceRotationTooltip,
  MODE_LABELS,
} from './help/displayModeHelp';
import { tileSelectOptions } from '@/features/app-shell/controls/tileSelectOptions';

const MAX_CULTURE_ID = 15;

const ROTATION_OPTIONS = [
  { value: String(RANDOM_ROTATION), text: 'random' },
  { value: '0', text: '0°' },
  { value: '1', text: '90°' },
  { value: '2', text: '180°' },
  { value: '3', text: '270°' },
];

export function DisplaySection({ node, kind }: { node: NodeInstance; kind: ValueKind }) {
  const { perform } = useEditedPipeline();
  return (
    <div className="mt-2 border-t border-dashed border-panel-edge pt-2">
      <KnobRow label="display" tip={displayModeTooltip(kind)}>
        <Select
          warn={elevationMisreadsTheField(node)}
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

const NOT_A_HEIGHT: readonly FieldSemantic[] = ['years', 'cost'];

function elevationMisreadsTheField(node: NodeInstance): boolean {
  const def = nodeTypeOf(node.type);
  if (node.display.mode !== 'elevation' || !def) return false;
  const semantic = outputSemanticOf(def, node.params);
  return semantic !== undefined && NOT_A_HEIGHT.includes(semantic);
}

function PieceRows({
  node,
  binding,
}: {
  node: NodeInstance;
  binding: Extract<DisplayBinding, { mode: 'pieces' }>;
}) {
  const { perform } = useEditedPipeline();
  const { pieces } = useAppRuntime();
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
  const { perform } = useEditedPipeline();
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
  const { perform } = useEditedPipeline();
  const { creatures } = useAppRuntime();
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
  const { perform } = useEditedPipeline();
  const { items } = useAppRuntime();
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
  const { perform } = useEditedPipeline();
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
  const { perform } = useEditedPipeline();
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
  const { perform } = useEditedPipeline();
  const { tileAssets } = useAppRuntime();
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

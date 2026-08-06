import { useAppRuntime } from '../../app/appRuntimeContext';
import {
  defaultBindingForMode,
  displayModesForKind,
  type DisplayMode,
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
import { displayModeTooltip, markerTileTooltip, MODE_LABELS } from './help/displayModeHelp';
import { tileSelectOptions } from './tileSelectOptions';

export function DisplaySection({ node, kind }: { node: NodeInstance; kind: ValueKind }) {
  const { store } = useAppRuntime();
  return (
    <div className="mt-2 border-t border-dashed border-panel-edge pt-2">
      <KnobRow label="display" tooltip={displayModeTooltip(kind)}>
        <Select
          value={node.display.mode}
          options={displayModesForKind(kind).map((mode) => ({
            value: mode,
            text: MODE_LABELS[mode],
          }))}
          onChange={(mode) => store.setDisplay(node.id, defaultBindingForMode(mode as DisplayMode))}
        />
      </KnobRow>
      {node.display.mode === 'elevation' && (
        <HeightScaleRow node={node} heightScale={node.display.heightScale} />
      )}
      {node.display.mode === 'markers' && <MarkerRows node={node} binding={node.display} />}
    </div>
  );
}

function HeightScaleRow({ node, heightScale }: { node: NodeInstance; heightScale: number }) {
  const { store } = useAppRuntime();
  return (
    <KnobRow label="height">
      <Slider
        min={0}
        max={10}
        step={0.1}
        value={heightScale}
        onChange={(value) => store.patchDisplay(node.id, { heightScale: value })}
      />
      <ValueReadout value={heightScale} />
    </KnobRow>
  );
}

function MarkerRows({ node, binding }: { node: NodeInstance; binding: MarkerBinding }) {
  const { store, tileset } = useAppRuntime();
  return (
    <>
      <KnobRow label="tile" tooltip={markerTileTooltip()}>
        <Select
          value={String(binding.tileId)}
          options={tileSelectOptions(tileset, '(custom glyph)')}
          onChange={(value) => store.setDisplay(node.id, { ...binding, tileId: Number(value) })}
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
                event.target.value && store.patchDisplay(node.id, { glyph: event.target.value })
              }
            />
          </KnobRow>
          <KnobRow label="color">
            <input
              type="color"
              className={COLOR_INPUT_CLASSES}
              value={binding.color}
              onChange={(event) => store.patchDisplay(node.id, { color: event.target.value })}
            />
          </KnobRow>
        </>
      )}
    </>
  );
}

import {
  defaultBindingForMode,
  displayModesForKind,
  type DisplayMode,
} from '../../procgen/display/displayBinding';
import type { MarkerBinding } from '../../procgen/display/markerAppearance';
import type { NodeInstance } from '../../procgen/pipeline/pipelineState';
import type { PipelineStore } from '../../procgen/pipeline/pipelineStore';
import type { ValueKind } from '../../procgen/values/chunkValues';
import type { Tileset } from '../../world/tiles/tileset';
import { attachTooltip } from '../tooltips/floatingTooltip';
import { displayModeTooltip, markerTileTooltip, MODE_LABELS } from './help/displayModeHelp';
import { formatNumber, labeledRow, rangeInput, selectInput, valueReadout } from './rowElements';
import { tileSelectOptions } from './tileSelectOptions';

export function displaySection(
  store: PipelineStore,
  tileset: Tileset,
  node: NodeInstance,
  kind: ValueKind,
): HTMLElement {
  const section = document.createElement('div');
  section.className = 'display-section';
  section.append(modeRow(store, node, kind), ...bindingControlRows(store, tileset, node));
  return section;
}

function modeRow(store: PipelineStore, node: NodeInstance, kind: ValueKind): HTMLElement {
  const select = selectInput(
    displayModesForKind(kind).map((mode) => ({ value: mode, text: MODE_LABELS[mode] })),
    node.display.mode,
    (mode) => store.setDisplay(node.id, defaultBindingForMode(mode as DisplayMode)),
  );
  const row = labeledRow('display', select);
  attachTooltip(row, displayModeTooltip(kind));
  return row;
}

function bindingControlRows(
  store: PipelineStore,
  tileset: Tileset,
  node: NodeInstance,
): HTMLElement[] {
  if (node.display.mode === 'elevation') return [heightScaleRow(store, node, node.display.heightScale)];
  if (node.display.mode === 'markers') return markerRows(store, tileset, node, node.display);
  return [];
}

function heightScaleRow(store: PipelineStore, node: NodeInstance, startValue: number): HTMLElement {
  const readout = valueReadout(formatNumber(startValue));
  const slider = rangeInput(0, 10, 0.1, startValue, (heightScale) => {
    readout.textContent = formatNumber(heightScale);
    store.patchDisplay(node.id, { heightScale });
  });
  return labeledRow('height', slider, readout);
}

function markerRows(
  store: PipelineStore,
  tileset: Tileset,
  node: NodeInstance,
  binding: MarkerBinding,
): HTMLElement[] {
  const rows = [markerTileRow(store, tileset, node, binding)];
  if (binding.tileId < 0) rows.push(glyphRow(store, node, binding.glyph), colorRow(store, node, binding.color));
  return rows;
}

function markerTileRow(
  store: PipelineStore,
  tileset: Tileset,
  node: NodeInstance,
  binding: MarkerBinding,
): HTMLElement {
  const select = selectInput(
    tileSelectOptions(tileset, '(custom glyph)'),
    String(binding.tileId),
    (value) => store.setDisplay(node.id, { ...binding, tileId: Number(value) }),
  );
  const row = labeledRow('tile', select);
  attachTooltip(row, markerTileTooltip());
  return row;
}

function glyphRow(store: PipelineStore, node: NodeInstance, glyph: string): HTMLElement {
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'glyph-input';
  input.maxLength = 2;
  input.value = glyph;
  input.addEventListener('change', () => {
    if (input.value) store.patchDisplay(node.id, { glyph: input.value });
  });
  return labeledRow('glyph', input);
}

function colorRow(store: PipelineStore, node: NodeInstance, color: string): HTMLElement {
  const input = document.createElement('input');
  input.type = 'color';
  input.value = color;
  input.addEventListener('input', () => store.patchDisplay(node.id, { color: input.value }));
  return labeledRow('color', input);
}

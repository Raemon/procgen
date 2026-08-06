import {
  defaultBindingForMode,
  displayModesForKind,
  type DisplayMode,
} from '../../procgen/display/displayBinding';
import type { NodeInstance } from '../../procgen/pipeline/pipelineState';
import type { PipelineStore } from '../../procgen/pipeline/pipelineStore';
import type { ValueKind } from '../../procgen/values/chunkValues';
import { formatNumber, labeledRow, rangeInput, selectInput, valueReadout } from './rowElements';

const MODE_LABELS: Record<DisplayMode, string> = {
  hidden: 'hidden',
  tileLayer: 'tile layer',
  elevation: 'elevation',
  markers: 'markers',
};

export function displaySection(
  store: PipelineStore,
  node: NodeInstance,
  kind: ValueKind,
): HTMLElement {
  const section = document.createElement('div');
  section.className = 'display-section';
  section.append(modeRow(store, node, kind), ...bindingControlRows(store, node));
  return section;
}

function modeRow(store: PipelineStore, node: NodeInstance, kind: ValueKind): HTMLElement {
  const select = selectInput(
    displayModesForKind(kind).map((mode) => ({ value: mode, text: MODE_LABELS[mode] })),
    node.display.mode,
    (mode) => store.setDisplay(node.id, defaultBindingForMode(mode as DisplayMode)),
  );
  return labeledRow('display', select);
}

function bindingControlRows(store: PipelineStore, node: NodeInstance): HTMLElement[] {
  if (node.display.mode === 'elevation') return [heightScaleRow(store, node, node.display.heightScale)];
  if (node.display.mode === 'markers') return markerRows(store, node, node.display.glyph, node.display.color);
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
  node: NodeInstance,
  glyph: string,
  color: string,
): HTMLElement[] {
  return [glyphRow(store, node, glyph), colorRow(store, node, color)];
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

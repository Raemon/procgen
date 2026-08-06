import { examplePipelines } from '../../procgen/presets/examplePipelines';
import { emptyPipeline } from '../../procgen/pipeline/pipelineState';
import { sanitizePipeline } from '../../procgen/pipeline/sanitizePipeline';
import type { PipelineStore } from '../../procgen/pipeline/pipelineStore';
import { labeledRow, selectInput } from './rowElements';

const PLACEHOLDER = '';

export function presetsRow(store: PipelineStore): HTMLElement {
  return labeledRow('examples', presetSelect(store), clearButton(store));
}

function presetSelect(store: PipelineStore): HTMLSelectElement {
  const options = [
    { value: PLACEHOLDER, text: 'load…' },
    ...examplePipelines().map((preset) => ({ value: preset.name, text: preset.name })),
  ];
  return selectInput(options, PLACEHOLDER, (name) => loadPreset(store, name));
}

function loadPreset(store: PipelineStore, name: string): void {
  const preset = examplePipelines().find((candidate) => candidate.name === name);
  if (!preset) return;
  if (!confirmReplace()) return;
  store.replaceAll(sanitizePipeline(preset.state));
}

function clearButton(store: PipelineStore): HTMLElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn';
  button.textContent = 'clear';
  button.title = 'remove all nodes';
  button.addEventListener('click', () => {
    if (confirmReplace()) store.replaceAll(emptyPipeline());
  });
  return button;
}

function confirmReplace(): boolean {
  return window.confirm('Replace the current pipeline?');
}

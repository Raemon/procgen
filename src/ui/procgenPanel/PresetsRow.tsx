import { useAppRuntime } from '../../app/appRuntimeContext';
import { emptyPipeline } from '../../procgen/pipeline/pipelineState';
import { sanitizePipeline } from '../../procgen/pipeline/sanitizePipeline';
import type { PipelineStore } from '../../procgen/pipeline/pipelineStore';
import { examplePipelines } from '../../procgen/presets/examplePipelines';
import { Button } from '../controls/Button';
import { KnobRow } from '../controls/KnobRow';
import { Select } from '../controls/Select';
import { examplesTooltip } from './help/examplesTooltip';

const PLACEHOLDER = '';

export function PresetsRow() {
  const { store } = useAppRuntime();
  return (
    <KnobRow label="examples" tooltip={examplesTooltip(examplePipelines())}>
      <Select
        value={PLACEHOLDER}
        options={presetOptions()}
        onChange={(name) => loadPreset(store, name)}
      />
      <Button title="remove all nodes" onClick={() => clearPipeline(store)}>
        clear
      </Button>
    </KnobRow>
  );
}

function presetOptions() {
  return [
    { value: PLACEHOLDER, text: 'load…' },
    ...examplePipelines().map((preset) => ({ value: preset.name, text: preset.name })),
  ];
}

function loadPreset(store: PipelineStore, name: string): void {
  const preset = examplePipelines().find((candidate) => candidate.name === name);
  if (preset && confirmReplace()) store.replaceAll(sanitizePipeline(preset.state));
}

function clearPipeline(store: PipelineStore): void {
  if (confirmReplace()) store.replaceAll(emptyPipeline());
}

function confirmReplace(): boolean {
  return window.confirm('Replace the current pipeline?');
}

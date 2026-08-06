import { useSyncExternalStore } from 'react';
import { useAppRuntime } from '../../app/appRuntimeContext';
import { emptyPipeline } from '../../procgen/pipeline/pipelineState';
import { sanitizePipeline } from '../../procgen/pipeline/sanitizePipeline';
import type { PipelineStore } from '../../procgen/pipeline/pipelineStore';
import { examplePipelines } from '../../procgen/presets/examplePipelines';
import type { WorldPreset } from '../../procgen/presets/worldPreset';
import type { WorldPresetLibrary } from '../../procgen/presets/worldPresetLibrary';
import { Button } from '../controls/Button';
import { KnobRow } from '../controls/KnobRow';
import { Select, type SelectOption } from '../controls/Select';
import { presetsTooltip } from './help/presetsTooltip';

const PLACEHOLDER = '';
const EXAMPLE_PREFIX = 'example:';
const SAVED_PREFIX = 'saved:';
const DELETE_CHOICE = 'delete-saved';

export function PresetsRow() {
  const { store, worldPresets } = useAppRuntime();
  const saved = useSyncExternalStore(
    (listener) => worldPresets.onChange(listener),
    () => worldPresets.savedPresets(),
  );
  return (
    <KnobRow label="presets" tooltip={presetsTooltip(examplePipelines(), saved)}>
      <Select
        value={PLACEHOLDER}
        options={presetOptions(saved)}
        onChange={(choice) => onPickChoice(store, worldPresets, choice)}
      />
      <div className="flex gap-1.5">
        <Button
          title="save the whole current pipeline as a named preset"
          onClick={() => saveCurrentPipeline(store, worldPresets)}
        >
          save
        </Button>
        <Button title="remove all nodes" onClick={() => clearPipeline(store)}>
          clear
        </Button>
      </div>
    </KnobRow>
  );
}

function presetOptions(saved: readonly WorldPreset[]): SelectOption[] {
  return [
    { value: PLACEHOLDER, text: 'load…' },
    ...examplePipelines().map((preset) => ({
      value: EXAMPLE_PREFIX + preset.name,
      text: preset.name,
    })),
    ...saved.map((preset) => ({ value: SAVED_PREFIX + preset.name, text: `★ ${preset.name}` })),
    ...(saved.length > 0 ? [{ value: DELETE_CHOICE, text: '✕ delete a saved preset…' }] : []),
  ];
}

function onPickChoice(store: PipelineStore, library: WorldPresetLibrary, choice: string): void {
  if (choice === DELETE_CHOICE) return deleteSavedPreset(library);
  const state = stateOfChoice(library, choice);
  if (state !== undefined && confirmReplace()) store.replaceAll(sanitizePipeline(state));
}

function stateOfChoice(library: WorldPresetLibrary, choice: string): unknown {
  if (choice.startsWith(EXAMPLE_PREFIX)) {
    const name = choice.slice(EXAMPLE_PREFIX.length);
    return examplePipelines().find((preset) => preset.name === name)?.state;
  }
  if (choice.startsWith(SAVED_PREFIX)) return library.byName(choice.slice(SAVED_PREFIX.length))?.state;
  return undefined;
}

function saveCurrentPipeline(store: PipelineStore, library: WorldPresetLibrary): void {
  if (store.nodes().length === 0) return window.alert('Nothing to save — the pipeline is empty.');
  const name = window.prompt('Save the whole pipeline as a preset named:')?.trim();
  if (!name) return;
  if (library.byName(name) && !window.confirm(`Overwrite your saved preset "${name}"?`)) return;
  library.save({ name, description: '', state: sanitizePipeline(store.snapshot()) });
}

function deleteSavedPreset(library: WorldPresetLibrary): void {
  const name = window.prompt('Delete which saved preset? (exact name)')?.trim();
  if (!name || !library.byName(name)) return;
  if (window.confirm(`Delete your saved preset "${name}"?`)) library.remove(name);
}

function clearPipeline(store: PipelineStore): void {
  if (confirmReplace()) store.replaceAll(emptyPipeline());
}

function confirmReplace(): boolean {
  return window.confirm('Replace the current pipeline?');
}

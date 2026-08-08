import { useSyncExternalStore } from 'react';
import { useAppRuntime } from '../../frontend/appRuntimeContext';
import type { ReadOnlyPipelineStore, ReadOnlyWorldPresetLibrary } from '../../frontend/readOnlyAssets';
import { examplePipelines } from '../presets/examplePipelines';
import type { WorldPreset } from '../presets/worldPreset';
import { Button } from '../../frontend/controls/Button';
import { KnobRow } from '../../frontend/controls/KnobRow';
import { Select, type SelectOption } from '../../frontend/controls/Select';
import { CLEAR_PIPELINE_TIP, SAVE_PRESET_TIP } from './help/pipelineTips';
import { presetsTooltip } from './help/presetsTooltip';

const PLACEHOLDER = '';
const EXAMPLE_PREFIX = 'example:';
const SAVED_PREFIX = 'saved:';
const DELETE_CHOICE = 'delete-saved';

export function PresetsRow() {
  const { store, worldPresets, perform } = useAppRuntime();
  const saved = useSyncExternalStore(
    (listener) => worldPresets.onChange(listener),
    () => worldPresets.savedPresets(),
  );
  return (
    <KnobRow label="presets" tip={presetsTooltip(examplePipelines(), saved)}>
      <Select
        value={PLACEHOLDER}
        options={presetOptions(saved)}
        onChange={(choice) => onPickChoice(perform, worldPresets, choice)}
      />
      <div className="flex gap-1.5">
        <Button
          tip={SAVE_PRESET_TIP}
          onClick={() => saveCurrentPipeline(perform, store, worldPresets)}
        >
          save
        </Button>
        <Button tip={CLEAR_PIPELINE_TIP} onClick={() => clearPipeline(perform)}>
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

type Perform = (action: string, params?: Record<string, unknown>) => unknown;

function onPickChoice(
  perform: Perform,
  library: ReadOnlyWorldPresetLibrary,
  choice: string,
): void {
  if (choice === DELETE_CHOICE) return deleteSavedPreset(perform, library);
  const name = presetNameOfChoice(choice);
  if (name && confirmReplace()) perform('load_preset', { name });
}

function presetNameOfChoice(choice: string): string | null {
  if (choice.startsWith(EXAMPLE_PREFIX)) return choice.slice(EXAMPLE_PREFIX.length);
  if (choice.startsWith(SAVED_PREFIX)) return choice.slice(SAVED_PREFIX.length);
  return null;
}

function saveCurrentPipeline(
  perform: Perform,
  store: ReadOnlyPipelineStore,
  library: ReadOnlyWorldPresetLibrary,
): void {
  if (store.nodes().length === 0) return window.alert('Nothing to save — the pipeline is empty.');
  const name = window.prompt('Save the whole pipeline as a preset named:')?.trim();
  if (!name) return;
  if (library.byName(name) && !window.confirm(`Overwrite your saved preset "${name}"?`)) return;
  perform('save_preset', { name });
}

function deleteSavedPreset(perform: Perform, library: ReadOnlyWorldPresetLibrary): void {
  const name = window.prompt('Delete which saved preset? (exact name)')?.trim();
  if (!name || !library.byName(name)) return;
  if (window.confirm(`Delete your saved preset "${name}"?`)) perform('delete_preset', { name });
}

function clearPipeline(perform: Perform): void {
  if (confirmReplace()) perform('clear_pipeline');
}

function confirmReplace(): boolean {
  return window.confirm('Replace the current pipeline?');
}

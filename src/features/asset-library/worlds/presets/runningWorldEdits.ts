import type { CommandParams } from '@/features/app-shell/runtime/commands/command';
import type { PipelineStore } from '../pipeline/pipelineStore';
import { sanitizePipeline } from '../pipeline/sanitizePipeline';
import { freeWorldName } from './freeWorldName';
import type { RunningWorld } from './runningWorld';
import type { WorldShelf } from './worldShelf';

const A_NAME_FOR_A_WORLD_NOBODY_NAMED = 'my world';

export interface RunningWorldEdits {
  saveWhatIsOpen(): void;
  runAWorldIfNoneIsRunning(): void;
}

export function runningWorldEdits(editor: {
  store: PipelineStore;
  worlds: WorldShelf;
  runningWorld: RunningWorld;
  perform(action: string, params?: CommandParams): unknown;
}): RunningWorldEdits {
  function saveWhatIsOpen(): void {
    const name = editor.runningWorld.name();
    if (!name || theRunningWorldAlreadyHoldsWhatIsOpen(name)) return;
    editor.perform('save_preset', { name });
  }

  function theRunningWorldAlreadyHoldsWhatIsOpen(name: string): boolean {
    const stored = editor.worlds.byName(name);
    return (
      stored !== undefined &&
      JSON.stringify(stored.state) === JSON.stringify(sanitizePipeline(editor.store.snapshot()))
    );
  }

  function runAWorldIfNoneIsRunning(): void {
    if (editor.worlds.byName(editor.runningWorld.name())) return;
    if (editor.store.nodes().length > 0) return adoptTheOpenPipelineAsAWorld();
    const first = editor.worlds.all()[0];
    if (first) editor.perform('run_world', { name: first.name });
  }

  function adoptTheOpenPipelineAsAWorld(): void {
    const name = freeWorldName(
      A_NAME_FOR_A_WORLD_NOBODY_NAMED,
      editor.worlds.all().map((world) => world.name),
    );
    editor.perform('save_preset', { name, description: 'The world that was open in the editor.' });
    editor.perform('run_world', { name });
  }

  return { saveWhatIsOpen, runAWorldIfNoneIsRunning };
}

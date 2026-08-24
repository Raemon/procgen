import type { CommandParams } from '@/features/app-shell/runtime/commands/command';
import type { PipelineStore } from '../pipeline/pipelineStore';
import { sanitizePipeline } from '../pipeline/sanitizePipeline';
import type { SavedWorldLibrary } from '../saved/savedWorldLibrary';
import { freeWorldSeedName } from '../seeds/freeWorldSeedName';
import type { WorldSeedShelf } from '../seeds/worldSeedShelf';
import type { RunningWorld } from './runningWorld';

const A_NAME_FOR_A_SEED_NOBODY_NAMED = 'my world';

export interface RunningWorldEdits {
  saveWhatIsOpen(): void;
  runSomethingIfNothingIsRunning(): void;
}

export function runningWorldEdits(editor: {
  store: PipelineStore;
  worldSeeds: WorldSeedShelf;
  savedWorlds: SavedWorldLibrary;
  runningWorld: RunningWorld;
  perform(action: string, params?: CommandParams): unknown;
}): RunningWorldEdits {
  function saveWhatIsOpen(): void {
    const name = editor.runningWorld.seedName();
    if (!name || theRunningSeedAlreadyHoldsWhatIsOpen(name)) return;
    editor.perform('save_world_seed', { name });
  }

  function theRunningSeedAlreadyHoldsWhatIsOpen(name: string): boolean {
    const stored = editor.worldSeeds.byName(name);
    return (
      stored !== undefined &&
      JSON.stringify(stored.state) === JSON.stringify(sanitizePipeline(editor.store.snapshot()))
    );
  }

  function runSomethingIfNothingIsRunning(): void {
    const running = editor.runningWorld.ref();
    if (running?.kind === 'saved') return resumeOrForget(running.name);
    if (running && editor.worldSeeds.byName(running.name)) return;
    if (editor.store.nodes().length > 0) return adoptTheOpenPipelineAsAWorldSeed();
    const first = editor.worldSeeds.all()[0];
    if (first) editor.perform('run_world_seed', { name: first.name });
  }

  function resumeOrForget(name: string): void {
    if (editor.savedWorlds.byName(name)) return void editor.perform('run_saved_world', { name });
    editor.runningWorld.run(null);
    runSomethingIfNothingIsRunning();
  }

  function adoptTheOpenPipelineAsAWorldSeed(): void {
    const name = freeWorldSeedName(
      A_NAME_FOR_A_SEED_NOBODY_NAMED,
      editor.worldSeeds.all().map((seed) => seed.name),
    );
    editor.perform('save_world_seed', {
      name,
      description: 'The world seed that was open in the editor.',
    });
    editor.perform('run_world_seed', { name });
  }

  return { saveWhatIsOpen, runSomethingIfNothingIsRunning };
}

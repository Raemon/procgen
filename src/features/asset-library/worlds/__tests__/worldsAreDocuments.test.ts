import '../nodes';
import { performCommand } from '@/features/app-shell/runtime/commands/performCommand';
import type { CommandContext } from '@/features/app-shell/runtime/commands/command';
import { CreatureAssets } from '@/features/asset-library/creatures/creatureAssets';
import { ItemAssets } from '@/features/asset-library/items/itemAssets';
import { NO_GROUND_ITEMS } from '@/features/asset-library/items/pickups/groundItems';
import { CultureAssets } from '@/features/asset-library/cultures/cultureAssets';
import { PieceAssets } from '@/features/asset-library/pieces/pieceAssets';
import { TileAssets } from '@/features/asset-library/tiles/tileAssets';
import { EditablePipelines } from '../editing/editablePipelines';
import type { EditedPipeline } from '../editing/editedPipeline';
import { emptyPipeline } from '../pipeline/pipelineState';
import { PipelineStore } from '../pipeline/pipelineStore';
import { exampleWorlds } from '../presets/exampleWorlds';
import { RunningWorld } from '../presets/runningWorld';
import { WorldPresetLibrary } from '../presets/worldPresetLibrary';
import { WorldShelf } from '../presets/worldShelf';
import { AssetFolders } from '@/features/asset-library/folders/assetFolders';
import { RandomizeHistory } from '../randomize/randomizeHistory';
import { TemplateLibrary } from '@/features/asset-library/node-groups/templateLibrary';
import { PuzzleWorld } from '@/features/game/puzzles/puzzleWorld';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';

const LONGER_THAN_THE_WRITE_BACK_WAIT_MS = 500;

export async function checkWorldsAreDocuments(check: CheckReporter): Promise<void> {
  await checkEditingAWorldThatIsNotRunningSavesItself(check);
  await checkEditingANodeGroupSavesItself(check);
  checkRunningAWorldPutsItOnScreen(check);
  checkDeletingAnExampleTakesItOffTheShelf(check);
}

async function checkEditingAWorldThatIsNotRunningSavesItself(check: CheckReporter): Promise<void> {
  const editor = worldEditor();
  const shelved = editor.worlds.all()[0]!;
  editor.act('run_world', { name: shelved.name });
  const other = editor.worlds.all()[1]!;
  const opened = editor.editing.world(other.name)!;
  opened.perform('set_seed', { seed: 4321 });
  await settle();
  check(
    'a world you edit without running it is the one that changes, and the running world is left alone',
    editor.worlds.byName(other.name)!.state.seed === 4321 &&
      editor.store.seed() === shelved.state.seed,
  );
  check(
    'the world being edited is a document of its own, not the pipeline on screen',
    opened !== editor.runningPipeline && opened.rendered === false,
  );
  check(
    'opening the running world hands back the pipeline on screen, so edits land live',
    editor.editing.world(shelved.name) === editor.runningPipeline,
  );
}

async function checkEditingANodeGroupSavesItself(check: CheckReporter): Promise<void> {
  const editor = worldEditor();
  const group = editor.templates.all()[0]!;
  const opened = editor.editing.group(group.name)!;
  const nodeCount = opened.store.nodes().length;
  opened.perform('remove_node', { node_id: opened.store.nodes()[0]!.id });
  await settle();
  check(
    'editing the nodes of a node group saves them back into the group',
    editor.templates.byName(group.name)!.nodes.length === nodeCount - 1,
  );
  check(
    'a built-in group edited that way is saved as yours, shadowing the one that ships',
    editor.templates.savedTemplates().some((saved) => saved.name === group.name),
  );
}

function checkRunningAWorldPutsItOnScreen(check: CheckReporter): void {
  const editor = worldEditor();
  const world = editor.worlds.all()[0]!;
  const ran = editor.act('run_world', { name: world.name });
  check(
    'running a world loads its nodes and names it as the world running',
    ran.ok &&
      editor.runningWorld.name() === world.name &&
      editor.store.nodes().length === world.state.nodes.length,
  );
}

function checkDeletingAnExampleTakesItOffTheShelf(check: CheckReporter): void {
  const editor = worldEditor();
  const example = exampleWorlds()[0]!;
  editor.act('delete_preset', { name: example.name });
  check(
    'a world that ships with the editor can be deleted like any other',
    editor.worlds.all().every((world) => world.name !== example.name),
  );
}

function settle(): Promise<void> {
  return new Promise((done) => setTimeout(done, LONGER_THAN_THE_WRITE_BACK_WAIT_MS));
}

function worldEditor() {
  const store = new PipelineStore(emptyPipeline());
  const worldPresets = new WorldPresetLibrary({
    presets: exampleWorlds().map((example) => structuredClone(example)),
    hiddenExamples: [],
  });
  const worlds = new WorldShelf(worldPresets);
  const templates = new TemplateLibrary({ templates: [], hiddenBuiltIns: [] });
  const runningWorld = new RunningWorld();
  const contextAround = (edited: PipelineStore): CommandContext =>
    ({
      store: edited,
      tileAssets: new TileAssets(),
      pieces: new PieceAssets(),
      cultures: new CultureAssets(),
      creatures: new CreatureAssets(),
      items: new ItemAssets(),
      templates,
      assetFolders: new AssetFolders({ folders: [], placements: {} }),
      worldPresets,
      runningWorld,
      randomizeHistory: new RandomizeHistory(),
      groundItems: NO_GROUND_ITEMS,
      puzzles: new PuzzleWorld(edited, () => true),
      regionSampler: { tileAt: () => 0, elevationAt: () => 0, packedVoxelColumnAt: () => null },
      actor: {
        pose: () => ({ x: 0, y: 0, facing: 0 }),
        tryStep: () => true,
        turn: () => undefined,
        sightRadiusTiles: () => 1,
        setSightRadiusTiles: () => undefined,
      },
    }) as unknown as CommandContext;
  const performOn = (edited: PipelineStore, action: string, params?: Record<string, unknown>) =>
    performCommand(contextAround(edited), 'god', action, params);
  const runningPipeline: EditedPipeline = {
    store,
    perform: (action, params) => performOn(store, action, params),
    rendered: true,
  };
  const editing = new EditablePipelines({
    performOn,
    runningPipeline,
    runningWorld,
    worldNamed: (name) => worlds.byName(name),
    groupNamed: (name) => templates.byName(name),
  });
  return {
    store,
    worlds,
    templates,
    runningWorld,
    runningPipeline,
    editing,
    act: (action: string, params?: Record<string, unknown>) => performOn(store, action, params),
  };
}

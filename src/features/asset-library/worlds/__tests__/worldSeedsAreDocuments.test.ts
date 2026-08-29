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
import { exampleWorldSeeds } from '../seeds/exampleWorldSeeds';
import { RunningWorld } from '../running/runningWorld';
import { WorldSeedLibrary } from '../seeds/worldSeedLibrary';
import { WorldSeedShelf } from '../seeds/worldSeedShelf';
import { AssetFolders } from '@/features/asset-library/folders/assetFolders';
import { RandomizeHistory } from '../randomize/randomizeHistory';
import { TemplateLibrary } from '@/features/asset-library/node-groups/templateLibrary';
import { PuzzleWorld } from '@/features/game/puzzles/puzzleWorld';
import { TakenItemSpawns } from '@/features/asset-library/items/pickups/takenItemSpawns';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';

const LONGER_THAN_THE_WRITE_BACK_WAIT_MS = 500;

export async function checkWorldSeedsAreDocuments(check: CheckReporter): Promise<void> {
  await checkEditingAWorldSeedThatIsNotRunningSavesItself(check);
  await checkEditingANodeGroupSavesItself(check);
  checkRunningAWorldSeedPutsItOnScreen(check);
  checkRollingANewWorldLeavesTheWorldItRolledFromAlone(check);
  checkARolledWorldYouNameIsYoursToKeep(check);
  checkRollingASeedYouAreNotRunningRewritesThatSeedAlone(check);
  checkUndoWithNothingToGoBackToLeavesTheWorldRunning(check);
  checkDeletingAnExampleTakesItOffTheShelf(check);
}

async function checkEditingAWorldSeedThatIsNotRunningSavesItself(check: CheckReporter): Promise<void> {
  const editor = worldSeedEditor();
  const shelved = editor.worlds.all()[0]!;
  editor.act('run_world_seed', { name: shelved.name });
  const other = editor.worlds.all()[1]!;
  const opened = editor.editing.worldSeed(other.name)!;
  opened.perform('set_seed', { seed: 4321 });
  await settle();
  check(
    'a world seed you edit without running it is the one that changes, and the running world is left alone',
    editor.worlds.byName(other.name)!.state.seed === 4321 &&
      editor.store.seed() === shelved.state.seed,
  );
  check(
    'the world seed being edited is a document of its own, not the pipeline on screen',
    opened !== editor.runningPipeline && opened.rendered === false,
  );
  check(
    'opening the running world seed hands back the pipeline on screen, so edits land live',
    editor.editing.worldSeed(shelved.name) === editor.runningPipeline,
  );
}

async function checkEditingANodeGroupSavesItself(check: CheckReporter): Promise<void> {
  const editor = worldSeedEditor();
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

function checkRunningAWorldSeedPutsItOnScreen(check: CheckReporter): void {
  const editor = worldSeedEditor();
  const world = editor.worlds.all()[0]!;
  const ran = editor.act('run_world_seed', { name: world.name });
  check(
    'running a world seed loads its nodes and names it as the world running',
    ran.ok &&
      editor.runningWorld.name() === world.name &&
      editor.store.nodes().length === world.state.nodes.length,
  );
}

function checkRollingANewWorldLeavesTheWorldItRolledFromAlone(check: CheckReporter): void {
  const editor = worldSeedEditor();
  const world = editor.worlds.all()[0]!;
  editor.act('run_world_seed', { name: world.name });
  editor.act('set_seed', { seed: 4321 });
  editor.act('save_world_seed', { name: world.name });

  const rolled = editor.act('randomize_world_seed', { seed: 7 });
  const rolledWorld = editor.runningWorld.seedName();
  check(
    'rolling a new world runs it under a name of its own instead of writing over the world it came from',
    rolled.ok && rolledWorld !== world.name && editor.worlds.byName(rolledWorld) !== undefined,
  );
  check(
    'the world the roll came from keeps the parameters it had',
    editor.worlds.byName(world.name)!.state.seed === 4321,
  );

  editor.act('randomize_world_seed', { seed: 8 });
  check(
    'rolling again writes over the rolled world rather than filling the library with rolls',
    editor.runningWorld.seedName() === rolledWorld &&
      editor.worlds.all().filter((seed) => seed.name === rolledWorld).length === 1,
  );

  editor.act('undo_randomize');
  editor.act('undo_randomize');
  check(
    'undoing the roll puts back both the pipeline and the world it belonged to',
    editor.runningWorld.seedName() === world.name && editor.store.seed() === 4321,
  );
}

function checkARolledWorldYouNameIsYoursToKeep(check: CheckReporter): void {
  const editor = worldSeedEditor();
  editor.act('run_world_seed', { name: editor.worlds.all()[0]!.name });
  editor.act('randomize_world_seed', { seed: 7 });
  const rolledWorld = editor.runningWorld.seedName();
  editor.act('rename_world_seed', { name: rolledWorld, new_name: `${rolledWorld} of spires` });
  const kept = editor.worlds.byName(`${rolledWorld} of spires`)!;

  editor.act('randomize_world_seed', { seed: 8 });
  check(
    'a rolled world you rename is a world like any other, and the next roll leaves it alone',
    editor.runningWorld.seedName() !== kept.name &&
      JSON.stringify(editor.worlds.byName(kept.name)!.state) === JSON.stringify(kept.state),
  );

  const editorOfATunedWorld = worldSeedEditor();
  editorOfATunedWorld.act('run_world_seed', { name: editorOfATunedWorld.worlds.all()[0]!.name });
  editorOfATunedWorld.act('save_world_seed', { name: 'rolled world', description: 'mine, tuned by hand' });
  editorOfATunedWorld.act('run_world_seed', { name: 'rolled world' });
  const mine = editorOfATunedWorld.worlds.byName('rolled world')!;
  editorOfATunedWorld.act('randomize_world_seed', { seed: 7 });
  check(
    'a world of your own that happens to be called rolled world is not taken over by a roll',
    editorOfATunedWorld.runningWorld.seedName() !== 'rolled world' &&
      editorOfATunedWorld.worlds.byName('rolled world')!.description === mine.description,
  );
}

function checkRollingASeedYouAreNotRunningRewritesThatSeedAlone(check: CheckReporter): void {
  const editor = worldSeedEditor();
  const running = editor.worlds.all()[0]!;
  editor.act('run_world_seed', { name: running.name });
  const other = editor.worlds.all()[1]!;
  const opened = editor.editing.worldSeed(other.name)!;

  opened.perform('randomize_world_seed', { seed: 7 });
  check(
    'rolling a world seed opened as a document rolls that document, leaving the world on screen running',
    editor.runningWorld.seedName() === running.name &&
      editor.worlds.byName(running.name) !== undefined &&
      JSON.stringify(opened.store.nodes()) !== JSON.stringify(other.state.nodes),
  );
}

function checkUndoWithNothingToGoBackToLeavesTheWorldRunning(check: CheckReporter): void {
  const editor = worldSeedEditor();
  editor.act('randomize_world_seed', { seed: 7 });
  const rolledWorld = editor.runningWorld.seedName();
  editor.act('undo_randomize');
  check(
    'undoing a roll made with nothing running leaves the rolled world running rather than nothing at all',
    rolledWorld !== '' && editor.runningWorld.seedName() === rolledWorld,
  );
}

function checkDeletingAnExampleTakesItOffTheShelf(check: CheckReporter): void {
  const editor = worldSeedEditor();
  const example = exampleWorldSeeds()[0]!;
  editor.act('delete_world_seed', { name: example.name });
  check(
    'a world that ships with the editor can be deleted like any other',
    editor.worlds.all().every((world) => world.name !== example.name),
  );
}

function settle(): Promise<void> {
  return new Promise((done) => setTimeout(done, LONGER_THAN_THE_WRITE_BACK_WAIT_MS));
}

function worldSeedEditor() {
  const store = new PipelineStore(emptyPipeline());
  const worldSeeds = new WorldSeedLibrary({
    seeds: exampleWorldSeeds().map((example) => structuredClone(example)),
    hiddenExamples: [],
  });
  const worlds = new WorldSeedShelf(worldSeeds);
  const templates = new TemplateLibrary({ templates: [], hiddenBuiltIns: [] });
  const runningWorld = new RunningWorld();
  const randomizeHistory = new RandomizeHistory();
  const contextAround = (edited: PipelineStore): CommandContext =>
    ({
      store: edited,
      pipelineIsOnScreen: edited === store,
      tileAssets: new TileAssets(),
      pieces: new PieceAssets(),
      cultures: new CultureAssets(),
      creatures: new CreatureAssets(),
      items: new ItemAssets(),
      templates,
      assetFolders: new AssetFolders({ folders: [], placements: {} }),
      worldSeeds,
      runningWorld,
      randomizeHistory,
      groundItems: NO_GROUND_ITEMS,
      puzzles: new PuzzleWorld(edited, () => true),
      takenItems: new TakenItemSpawns(),
      regionSampler: { tileAt: () => 0, elevationAt: () => 0, packedVoxelColumnAt: () => null },
      settleTheWorld: (change: () => void) => change(),
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
    worldSeedNamed: (name) => worlds.byName(name),
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

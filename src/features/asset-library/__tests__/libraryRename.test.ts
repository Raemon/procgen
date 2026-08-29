import '@/features/asset-library/worlds/nodes';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import type { CommandContext, CommandParams } from '@/features/app-shell/runtime/commands/command';
import { performCommand } from '@/features/app-shell/runtime/commands/performCommand';
import { persistedDocumentIsValid } from '@/features/app-shell/api/persistedDocumentValidation';
import { CreatureAssets } from '@/features/asset-library/creatures/creatureAssets';
import { CultureAssets } from '@/features/asset-library/cultures/cultureAssets';
import { ItemAssets } from '@/features/asset-library/items/itemAssets';
import { NO_GROUND_ITEMS } from '@/features/asset-library/items/pickups/groundItems';
import { PieceAssets } from '@/features/asset-library/pieces/pieceAssets';
import { TileAssets } from '@/features/asset-library/tiles/tileAssets';
import { TemplateLibrary } from '@/features/asset-library/node-groups/templateLibrary';
import { AssetFolders } from '@/features/asset-library/folders/assetFolders';
import { builtInTemplates } from '@/features/asset-library/node-groups/builtInTemplates';
import { templateLibraryFromStoredJson } from '@/features/asset-library/node-groups/storedTemplateLibrary';
import { emptyPipeline } from '@/features/asset-library/worlds/pipeline/pipelineState';
import { PipelineStore } from '@/features/asset-library/worlds/pipeline/pipelineStore';
import { exampleWorldSeeds } from '@/features/asset-library/worlds/seeds/exampleWorldSeeds';
import { RunningWorld } from '@/features/asset-library/worlds/running/runningWorld';
import { WorldSeedLibrary } from '@/features/asset-library/worlds/seeds/worldSeedLibrary';
import { WorldSeedShelf } from '@/features/asset-library/worlds/seeds/worldSeedShelf';
import { RandomizeHistory } from '@/features/asset-library/worlds/randomize/randomizeHistory';
import { PuzzleWorld } from '@/features/game/puzzles/puzzleWorld';
import { TakenItemSpawns } from '@/features/asset-library/items/pickups/takenItemSpawns';
import { nextSelectionOnOpen } from '../librarySelection';

export function checkLibraryRename(check: CheckReporter): void {
  checkRenamingAWorldSeed(check);
  checkRenamingANodeGroup(check);
  checkEveryAssetKindRenamesThroughItsCommand(check);
  checkOpeningARowFromTheLibrary(check);
  checkTheLibrariesSurviveTheirOwnStorage(check);
}

function renamer() {
  const store = new PipelineStore(emptyPipeline());
  const worldSeeds = new WorldSeedLibrary({
    seeds: [{ name: 'my delve', description: 'mine', state: emptyPipeline() }],
    hiddenExamples: [],
  });
  const context = {
    store,
    pipelineIsOnScreen: true,
    tileAssets: new TileAssets(),
    pieces: new PieceAssets(),
    cultures: new CultureAssets(),
    creatures: new CreatureAssets(),
    items: new ItemAssets(),
    templates: new TemplateLibrary({ templates: [], hiddenBuiltIns: [] }),
    assetFolders: new AssetFolders({
      folders: [{ id: 'f1', name: 'Round 1', section: 'worldSeeds', parentId: null }],
      placements: { worldSeeds: { 'my delve': 'f1' } },
    }),
    worldSeeds,
    runningWorld: new RunningWorld(),
    randomizeHistory: new RandomizeHistory(),
    groundItems: NO_GROUND_ITEMS,
    takenItems: new TakenItemSpawns(),
    puzzles: new PuzzleWorld(store, () => true),
    regionSampler: { tileAt: () => 0, elevationAt: () => 0, packedVoxelColumnAt: () => null },
    settleTheWorld: (change: () => void) => change(),
    actor: {
      pose: () => ({ x: 0, y: 0, facing: 0 }),
      tryStep: () => true,
      turn: () => undefined,
      sightRadiusTiles: () => 1,
      setSightRadiusTiles: () => undefined,
    },
  } as unknown as CommandContext;
  return {
    context,
    worldSeedShelf: new WorldSeedShelf(worldSeeds),
    act: (action: string, params: CommandParams = {}) =>
      performCommand(context, 'god', action, params),
  };
}

function checkRenamingAWorldSeed(check: CheckReporter): void {
  const saved = renamer();
  saved.act('run_world_seed', { name: 'my delve' });
  const renamed = saved.act('rename_world_seed', { name: 'my delve', new_name: 'the deep delve' });
  check(
    'renaming a world seed files it under the new name and leaves nothing behind under the old one',
    renamed.ok &&
      saved.worldSeedShelf.byName('the deep delve') !== undefined &&
      saved.worldSeedShelf.byName('my delve') === undefined,
  );
  check(
    'a world seed that was running keeps running under the name you gave it',
    saved.context.runningWorld.name() === 'the deep delve',
  );
  check(
    'a renamed world seed stays in the folder it was filed under',
    saved.context.assetFolders.folderOf('worldSeeds', 'the deep delve') === 'f1' &&
      saved.context.assetFolders.folderOf('worldSeeds', 'my delve') === null,
  );

  const taken = renamer();
  taken.act('save_world_seed', { name: 'my delve' });
  const refused = taken.act('rename_world_seed', {
    name: 'my delve',
    new_name: exampleWorldSeeds()[0]!.name,
  });
  check(
    'a world seed rename onto a name the library already holds is refused rather than overwriting it',
    !refused.ok && refused.code === 'name_taken',
  );

  const example = renamer();
  const shipped = exampleWorldSeeds()[0]!.name;
  const tookOver = example.act('rename_world_seed', { name: shipped, new_name: 'my own islands' });
  check(
    'renaming a world seed that ships with the editor saves your copy and takes the example off the shelf',
    tookOver.ok &&
      example.worldSeedShelf.byName('my own islands') !== undefined &&
      example.worldSeedShelf.byName(shipped) === undefined &&
      example.context.worldSeeds.hiddenExamples().includes(shipped),
  );

  const missing = renamer().act('rename_world_seed', { name: 'no such world', new_name: 'x' });
  check(
    'renaming a world seed the library has never held names the ones it does hold',
    !missing.ok && missing.code === 'unknown_world_seed',
  );
}

function checkRenamingANodeGroup(check: CheckReporter): void {
  const groups = renamer();
  const nodeIds = () => groups.context.store.nodes().map((node) => node.id);
  groups.act('add_node', { type: 'noiseField' });
  groups.act('save_template', { name: 'my ridges', node_ids: nodeIds() });
  const renamed = groups.act('rename_template', { name: 'my ridges', new_name: 'ridge lines' });
  check(
    'renaming a saved node group files it under the new name and drops the old one',
    renamed.ok &&
      groups.context.templates.byName('ridge lines') !== undefined &&
      groups.context.templates.byName('my ridges') === undefined,
  );
  const refused = groups.act('rename_template', {
    name: 'ridge lines',
    new_name: builtInTemplates()[0]!.name,
  });
  check(
    'a node group rename onto a name the library already holds is refused',
    !refused.ok && refused.code === 'name_taken',
  );

  const shipped = builtInTemplates()[0]!.name;
  const tookOver = groups.act('rename_template', { name: shipped, new_name: 'my own plates' });
  check(
    'renaming a node group that ships with the editor saves your copy and takes the built-in off the shelf',
    tookOver.ok &&
      groups.context.templates.byName('my own plates') !== undefined &&
      groups.context.templates.byName(shipped) === undefined &&
      groups.context.templates.hiddenBuiltIns().includes(shipped),
  );
}

function checkEveryAssetKindRenamesThroughItsCommand(check: CheckReporter): void {
  const assets = renamer();
  assets.act('add_tile');
  assets.act('add_item');
  assets.act('add_piece');
  assets.act('add_culture');
  assets.act('add_creature');
  const tile = assets.context.tileAssets.all().at(-1)!;
  const item = assets.context.items.all().at(-1)!;
  const piece = assets.context.pieces.all().at(-1)!;
  const culture = assets.context.cultures.all().at(-1)!;
  const creature = assets.context.creatures.all().at(-1)!;
  const renamed = [
    assets.act('update_tile', { tile_id: tile.id, name: 'named tile' }),
    assets.act('update_item', { item_id: item.id, name: 'named item' }),
    assets.act('rename_piece', { piece_id: piece.id, name: 'named piece' }),
    assets.act('rename_culture', { culture_id: culture.id, name: 'named culture' }),
    assets.act('update_creature', { creature_id: creature.id, name: 'named creature' }),
  ];
  check(
    'every asset kind a library row can rename has a command that renames it',
    renamed.every((result) => result.ok),
  );
  check(
    'a rename read back from the asset stores is the name the row will show',
    assets.context.tileAssets.byId(tile.id)!.name === 'named tile' &&
      assets.context.items.byId(item.id)!.name === 'named item' &&
      assets.context.pieces.byId(piece.id)!.name === 'named piece' &&
      assets.context.cultures.byId(culture.id)!.name === 'named culture' &&
      assets.context.creatures.byId(creature.id)!.name === 'named creature',
  );
}

function checkOpeningARowFromTheLibrary(check: CheckReporter): void {
  const opened = nextSelectionOnOpen(null, 'tiles', '3');
  check(
    'opening an unselected row selects it and opens the detail column on it',
    opened.selection?.folder === 'tiles' && opened.selection.key === '3' && opened.detailIsOpen,
  );
  const closed = nextSelectionOnOpen({ folder: 'tiles', key: '3' }, 'tiles', '3');
  check(
    'opening the row already selected clears the selection and closes the detail column',
    closed.selection === null && !closed.detailIsOpen,
  );
  const moved = nextSelectionOnOpen({ folder: 'tiles', key: '3' }, 'worldSeeds', 'islands');
  check(
    'opening another row moves the selection to it rather than closing the column',
    moved.selection?.folder === 'worldSeeds' && moved.selection.key === 'islands' && moved.detailIsOpen,
  );
}

function checkTheLibrariesSurviveTheirOwnStorage(check: CheckReporter): void {
  const templates = new TemplateLibrary({ templates: [], hiddenBuiltIns: ['rivers'] });
  const restored = templateLibraryFromStoredJson(JSON.parse(JSON.stringify(templates.stored())));
  check(
    'the node groups a rename hid stay hidden through the round trip to storage',
    restored.hiddenBuiltIns.join() === 'rivers',
  );
  check(
    'a node group document stored as the bare array it once was still reads back',
    templateLibraryFromStoredJson([]).templates.length === 0,
  );
  check(
    'the worldSeedShelf and node groups a rename writes are shapes their own resource accepts',
    persistedDocumentIsValid('worldSeeds', { seeds: [], hiddenExamples: [] }) &&
      persistedDocumentIsValid('templates', templates.stored()),
  );
}

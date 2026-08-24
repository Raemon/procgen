import '../nodes';
import { performCommand } from '@/features/app-shell/runtime/commands/performCommand';
import type { CommandContext } from '@/features/app-shell/runtime/commands/command';
import { CreatureAssets } from '@/features/asset-library/creatures/creatureAssets';
import { ItemAssets } from '@/features/asset-library/items/itemAssets';
import { NO_GROUND_ITEMS } from '@/features/asset-library/items/pickups/groundItems';
import { TakenItemSpawns } from '@/features/asset-library/items/pickups/takenItemSpawns';
import { CultureAssets } from '@/features/asset-library/cultures/cultureAssets';
import { PieceAssets } from '@/features/asset-library/pieces/pieceAssets';
import { TileAssets } from '@/features/asset-library/tiles/tileAssets';
import { AssetFolders } from '@/features/asset-library/folders/assetFolders';
import { TemplateLibrary } from '@/features/asset-library/node-groups/templateLibrary';
import { PuzzleWorld } from '@/features/game/puzzles/puzzleWorld';
import { assetId, type ItemId } from '@/features/asset-library/asset';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { emptyPipeline } from '../pipeline/pipelineState';
import { PipelineStore } from '../pipeline/pipelineStore';
import { RandomizeHistory } from '../randomize/randomizeHistory';
import { RunningWorld } from '../running/runningWorld';
import { runningWorldRefFrom } from '../running/runningWorldStorage';
import { SavedWorldLibrary } from '../saved/savedWorldLibrary';
import { savedWorldsFromStoredJson } from '../saved/storedSavedWorlds';
import { exampleWorldSeeds } from '../seeds/exampleWorldSeeds';
import { WorldSeedLibrary } from '../seeds/worldSeedLibrary';
import { worldSeedLibraryFromStoredJson } from '../seeds/storedWorldSeedLibrary';

export function checkSavedWorlds(check: CheckReporter): void {
  checkASaveRemembersWhatThePlayerDid(check);
  checkASaveOutlivesTheSeedItGrewFrom(check);
  checkSavedWorldRowsAreEditedLikeAnyOtherAsset(check);
  checkDocumentsWrittenBeforeTheRenameStillLoad(check);
}

function checkASaveRemembersWhatThePlayerDid(check: CheckReporter): void {
  const game = playableWorld();
  game.act('run_world_seed', { name: game.aSeedName() });
  game.walkTo(7, 3, 2);
  game.pickUp(7, 3, 5);
  game.workFixture('cell/lever');
  game.act('save_world', { name: 'halfway down' });

  check(
    'saving switches the running world from the seed to the save',
    game.runningWorld.savedWorldName() === 'halfway down' && game.runningWorld.seedName() === '',
  );

  game.walkTo(0, 0, 0);
  game.takenItems.forgetAll();
  game.puzzles.state.forgetAll();
  const ran = game.act('run_saved_world', { name: 'halfway down' });

  check(
    'running a save puts the player back where they left off',
    ran.ok && game.pose.x === 7 && game.pose.y === 3 && game.pose.facing === 2,
  );
  check(
    'running a save puts back the items that had already been taken off the ground',
    game.takenItems.isTaken({ x: 7, y: 3, itemId: assetId<'items'>(5) }),
  );
  check(
    'running a save puts back the puzzle fixtures that had been worked',
    game.puzzles.state.isOn('cell/lever'),
  );
}

function checkASaveOutlivesTheSeedItGrewFrom(check: CheckReporter): void {
  const game = playableWorld();
  const seedName = game.aSeedName();
  game.act('run_world_seed', { name: seedName });
  game.act('set_seed', { seed: 777 });
  game.act('save_world', { name: 'before the edit' });

  game.act('run_world_seed', { name: seedName });
  game.act('set_seed', { seed: 999 });
  game.act('delete_world_seed', { name: seedName });

  const saved = game.savedWorlds.byName('before the edit')!;
  check(
    'a save keeps its own copy of the pipeline, so editing the seed cannot move it',
    saved.state.seed === 777,
  );
  check('a save records which seed it grew from', saved.seededBy === seedName);
  check(
    'a save survives deleting the seed it grew from, and still runs',
    game.act('run_saved_world', { name: 'before the edit' }).ok && game.store.seed() === 777,
  );
}

function checkSavedWorldRowsAreEditedLikeAnyOtherAsset(check: CheckReporter): void {
  const game = playableWorld();
  game.act('run_world_seed', { name: game.aSeedName() });
  game.act('save_world', { name: 'first camp' });

  const copied = game.act('duplicate_saved_world', { name: 'first camp' });
  check(
    'duplicating a save files it under a free name',
    copied.ok && game.savedWorlds.byName('first camp copy') !== undefined,
  );

  const renamed = game.act('rename_saved_world', { name: 'first camp', new_name: 'base camp' });
  check(
    'renaming a save carries the running world along with it',
    renamed.ok &&
      game.savedWorlds.byName('first camp') === undefined &&
      game.runningWorld.savedWorldName() === 'base camp',
  );

  const taken = game.act('rename_saved_world', { name: 'base camp', new_name: 'first camp copy' });
  check('a rename onto a name already in use is refused', !taken.ok && taken.code === 'name_taken');

  const gone = game.act('delete_saved_world', { name: 'base camp' });
  check(
    'deleting the running save leaves nothing running',
    gone.ok && game.runningWorld.ref() === null,
  );

  const missing = game.act('run_saved_world', { name: 'base camp' });
  check(
    'running a save that is not there names the ones that are',
    !missing.ok && missing.code === 'unknown_saved_world' && missing.hint.includes('first camp copy'),
  );
}

function checkDocumentsWrittenBeforeTheRenameStillLoad(check: CheckReporter): void {
  const shipped = exampleWorldSeeds()[0]!;
  check(
    'a world library stored under the old presets key still loads as world seeds',
    worldSeedLibraryFromStoredJson({ presets: [shipped], hiddenExamples: [] }).seeds.length === 1,
  );
  check(
    'a running world stored as a bare name still resolves to the seed it named',
    runningWorldRefFrom('islands')?.kind === 'seed' &&
      runningWorldRefFrom('islands')?.name === 'islands',
  );
  check(
    'a saved world with junk where its record should be loads with an empty record, not a crash',
    savedWorldsFromStoredJson({
      worlds: [
        { name: 'ok', state: shipped.state, takenItems: 'nope', puzzles: 7, player: null },
        { name: '', state: shipped.state },
      ],
    }).worlds.length === 1,
  );
}

function playableWorld() {
  const store = new PipelineStore(emptyPipeline());
  const worldSeeds = new WorldSeedLibrary({
    seeds: exampleWorldSeeds().map((example) => structuredClone(example)),
    hiddenExamples: [],
  });
  const savedWorlds = new SavedWorldLibrary({ worlds: [] });
  const takenItems = new TakenItemSpawns();
  const runningWorld = new RunningWorld();
  const puzzles = new PuzzleWorld(store, () => true);
  const pose = { x: 0, y: 0, facing: 0 };
  const context = {
    store,
    tileAssets: new TileAssets(),
    pieces: new PieceAssets(),
    cultures: new CultureAssets(),
    creatures: new CreatureAssets(),
    items: new ItemAssets(),
    templates: new TemplateLibrary({ templates: [], hiddenBuiltIns: [] }),
    assetFolders: new AssetFolders({ folders: [], placements: {} }),
    worldSeeds,
    savedWorlds,
    takenItems,
    runningWorld,
    randomizeHistory: new RandomizeHistory(),
    groundItems: NO_GROUND_ITEMS,
    puzzles,
    regionSampler: { tileAt: () => 0, elevationAt: () => 0, packedVoxelColumnAt: () => null },
    actor: {
      pose: () => pose,
      snapTo: (x: number, y: number, facing: number) => {
        pose.x = x;
        pose.y = y;
        pose.facing = facing;
      },
      tryStep: () => true,
      turn: () => undefined,
      sightRadiusTiles: () => 1,
      setSightRadiusTiles: () => undefined,
    },
  } as unknown as CommandContext;
  return {
    store,
    savedWorlds,
    takenItems,
    puzzles,
    runningWorld,
    pose,
    aSeedName: () => worldSeeds.savedWorldSeeds()[0]!.name,
    act: (action: string, params?: Record<string, unknown>) =>
      performCommand(context, 'god', action, params),
    walkTo: (x: number, y: number, facing: number) => context.actor.snapTo(x, y, facing as never),
    pickUp: (x: number, y: number, itemId: number) =>
      takenItems.take({ x, y, itemId: itemId as ItemId }),
    workFixture: (id: string) => puzzles.state.setOn(id, true),
  };
}

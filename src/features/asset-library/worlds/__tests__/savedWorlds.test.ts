import '../nodes';
import { performCommand } from '@/features/app-shell/runtime/commands/performCommand';
import type { CommandContext } from '@/features/app-shell/runtime/commands/command';
import { CreatureAssets } from '@/features/asset-library/creatures/creatureAssets';
import { playerCharacterDef } from '@/features/asset-library/characters/playerCharacter';
import { ItemAssets } from '@/features/asset-library/items/itemAssets';
import { stowEverythingOnTile } from '@/features/asset-library/items/pickups/stowItems';
import type { ItemSpawn } from '@/features/asset-library/worlds/worldSampler';
import { TakenItemSpawns } from '@/features/asset-library/items/pickups/takenItemSpawns';
import { CultureAssets } from '@/features/asset-library/cultures/cultureAssets';
import { PieceAssets } from '@/features/asset-library/pieces/pieceAssets';
import { TileAssets } from '@/features/asset-library/tiles/tileAssets';
import { AssetFolders } from '@/features/asset-library/folders/assetFolders';
import { TemplateLibrary } from '@/features/asset-library/node-groups/templateLibrary';
import { PuzzleWorld } from '@/features/game/puzzles/puzzleWorld';
import { assetId, type ItemId } from '@/features/asset-library/asset';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { persistWorld, type ServerWorld } from '@/features/agents/api/serverWorld';
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
  checkAnItemPickedUpIsNeitherDuplicatedNorLostByASave(check);
  checkRestoreIsOneSettledChange(check);
  checkASaveOutlivesTheSeedItGrewFrom(check);
  checkRollingANewWorldLeavesTheSaveItRolledFromAlone(check);
  checkSavedWorldRowsAreEditedLikeAnyOtherAsset(check);
  checkDocumentsWrittenBeforeTheRenameStillLoad(check);
  checkTheServerWritesSavesBackToTheDatabase(check);
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

function checkAnItemPickedUpIsNeitherDuplicatedNorLostByASave(check: CheckReporter): void {
  const game = playableWorld();
  game.act('run_world_seed', { name: game.aSeedName() });
  const torch = game.layAnItemOnTheGround(4, 4);

  game.walkTo(4, 4, 0);
  game.walkOverWhateverIsUnderfoot();
  check(
    'walking over an item puts it in the bag and takes it off the ground',
    game.carriedItemIds().length === 1 && game.takenItems.isTaken({ x: 4, y: 4, itemId: torch }),
  );

  game.act('save_world', { name: 'after the torch' });
  game.walkTo(0, 0, 0);
  game.emptyTheBag();
  game.takenItems.forgetAll();
  game.act('run_saved_world', { name: 'after the torch' });

  check(
    'a restored save puts back what the player was carrying',
    game.carriedItemIds().join() === String(torch),
  );
  check(
    'a restored save leaves a carried item off the ground, so running it twice cannot duplicate it',
    game.takenItems.isTaken({ x: 4, y: 4, itemId: torch }),
  );

  game.act('run_saved_world', { name: 'after the torch' });
  check(
    'resuming the same save again still leaves exactly one of the item',
    game.carriedItemIds().length === 1,
  );
}

function checkRestoreIsOneSettledChange(check: CheckReporter): void {
  const game = playableWorld();
  game.act('run_world_seed', { name: game.aSeedName() });
  game.act('save_world', { name: 'a camp' });
  game.forgetSettling();
  game.act('run_saved_world', { name: 'a camp' });
  check(
    'a restore swaps the pipeline, the deltas and the pose inside one settled change',
    game.settledChanges() === 1 && game.escapedTheSettle() === false,
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

function checkRollingANewWorldLeavesTheSaveItRolledFromAlone(check: CheckReporter): void {
  const game = playableWorld();
  game.act('run_world_seed', { name: game.aSeedName() });
  game.act('set_seed', { seed: 4321 });
  game.act('save_world', { name: 'a camp' });

  game.act('randomize_world_seed', { seed: 7 });
  check(
    'a save is left behind by a roll, not written over by it',
    game.savedWorlds.byName('a camp')!.state.seed === 4321 &&
      game.runningWorld.savedWorldName() === '',
  );
  check(
    'the roll runs as a world seed of its own',
    game.runningWorld.seedName() !== '' &&
      game.worldSeeds.byName(game.runningWorld.seedName()) !== undefined,
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

function checkTheServerWritesSavesBackToTheDatabase(check: CheckReporter): void {
  const written = new Map<string, unknown>();
  persistWorld({ write: (name, json) => void written.set(name, json) }, {
    store: { snapshot: () => emptyPipeline() },
    tileAssets: { all: () => [] },
    pieces: { all: () => [] },
    cultures: { all: () => [] },
    creatures: { all: () => [] },
    items: { all: () => [] },
    templates: { stored: () => ({ templates: [], hiddenBuiltIns: [] }) },
    worldSeeds: { stored: () => ({ seeds: [], hiddenExamples: [] }) },
    savedWorlds: { stored: () => ({ worlds: [{ name: 'camp' }] }) },
    assetFolders: { stored: () => ({ folders: [], placements: {} }) },
  } as unknown as ServerWorld);
  check(
    'a save an agent made reaches the database, not just the memory it was made in',
    JSON.stringify(written.get('savedWorlds')) === JSON.stringify({ worlds: [{ name: 'camp' }] }),
  );
}

function playableWorld() {
  const store = new PipelineStore(emptyPipeline());
  const creatures = new CreatureAssets();
  const items = new ItemAssets();
  if (!playerCharacterDef(creatures)) creatures.addCharacter();
  const theBag = () => playerCharacterDef(creatures)?.inventory ?? null;
  const onTheGround: ItemSpawn[] = [];
  const worldSeeds = new WorldSeedLibrary({
    seeds: exampleWorldSeeds().map((example) => structuredClone(example)),
    hiddenExamples: [],
  });
  const savedWorlds = new SavedWorldLibrary({ worlds: [] });
  const takenItems = new TakenItemSpawns();
  const runningWorld = new RunningWorld();
  const puzzles = new PuzzleWorld(store, () => true);
  const pose = { x: 0, y: 0, facing: 0 };
  let settled = 0;
  let inASettle = false;
  let escaped = false;
  store.onChange(() => {
    if (!inASettle) escaped = true;
  });
  const context = {
    store,
    pipelineIsOnScreen: true,
    tileAssets: new TileAssets(),
    pieces: new PieceAssets(),
    cultures: new CultureAssets(),
    creatures,
    items,
    templates: new TemplateLibrary({ templates: [], hiddenBuiltIns: [] }),
    assetFolders: new AssetFolders({ folders: [], placements: {} }),
    worldSeeds,
    savedWorlds,
    takenItems,
    runningWorld,
    randomizeHistory: new RandomizeHistory(),
    groundItems: {
      at: (x: number, y: number) =>
        onTheGround.filter(
          (spawn) =>
            spawn.x === x && spawn.y === y && !takenItems.isTaken(spawn),
        ),
      take: (spawn: ItemSpawn) => takenItems.take(spawn),
    },
    puzzles,
    regionSampler: { tileAt: () => 0, elevationAt: () => 0, packedVoxelColumnAt: () => null },
    settleTheWorld: (change: () => void) => {
      settled++;
      inASettle = true;
      try {
        change();
      } finally {
        inASettle = false;
      }
    },
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
    worldSeeds,
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
    layAnItemOnTheGround: (x: number, y: number) => {
      const item = items.add();
      onTheGround.push({ x, y, itemId: item.id, name: item.name, glyph: '', color: '', tag: 'test' });
      return item.id;
    },
    walkOverWhateverIsUnderfoot: () =>
      stowEverythingOnTile({ creatures, items, groundItems: context.groundItems }, pose.x, pose.y),
    carriedItemIds: () => (theBag()?.placements ?? []).map((placed) => placed.itemId),
    emptyTheBag: () => {
      const carrier = playerCharacterDef(creatures);
      if (carrier?.inventory) {
        creatures.update(carrier.id, { inventory: { ...carrier.inventory, placements: [] } });
      }
    },
    forgetSettling: () => {
      settled = 0;
      escaped = false;
    },
    settledChanges: () => settled,
    escapedTheSettle: () => escaped,
  };
}

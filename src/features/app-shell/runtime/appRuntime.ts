import { commandFor } from '@/features/app-shell/runtime/commands/commandCatalog';
import { performCommand } from '@/features/app-shell/runtime/commands/performCommand';
import {
  commandSucceeded,
  type CommandMode,
  type CommandResult,
  type CommandParams,
} from '@/features/app-shell/runtime/commands/command';
import { ChatComposerState } from '@/features/game/chat/chatComposerState';
import { AssetFolders } from '@/features/asset-library/folders/assetFolders';
import { CreatureAssets } from '@/features/asset-library/creatures/creatureAssets';
import { ItemAssets } from '@/features/asset-library/items/itemAssets';
import { PlayerInventoryPanelState } from '@/features/asset-library/items/inventory/playerInventoryPanelState';
import { groundItemsOf } from '@/features/asset-library/items/pickups/groundItems';
import { PickupFeed } from '@/features/asset-library/items/pickups/pickupFeed';
import { TakenItemSpawns } from '@/features/asset-library/items/pickups/takenItemSpawns';
import { WalkOverPickup } from '@/features/asset-library/items/pickups/walkOverPickup';
import { MultiplayerSession } from '@/features/game/multiplayer/client/multiplayerSession';
import { CreatureClock } from '@/features/game/creatureSim/creatureClock';
import { CreatureSim } from '@/features/game/creatureSim/creatureSim';
import { creatureAwareOverlay } from '@/features/agents/creatureMarkers';
import type { ObservedOverlay } from '@/features/agents/observation';
import { PipelineEvaluator } from '@/features/asset-library/worlds/eval/evaluator';
import { EditablePipelines } from '@/features/asset-library/worlds/editing/editablePipelines';
import type { EditedPipeline } from '@/features/asset-library/worlds/editing/editedPipeline';
import { attachPipelinePersistence, loadStoredPipeline } from '@/features/asset-library/worlds/pipeline/pipelineStorage';
import { PipelineStore } from '@/features/asset-library/worlds/pipeline/pipelineStore';
import { runningWorldEdits } from '@/features/asset-library/worlds/running/runningWorldEdits';
import { RunningWorld } from '@/features/asset-library/worlds/running/runningWorld';
import {
  attachRunningWorldPersistence,
  loadRunningWorld,
} from '@/features/asset-library/worlds/running/runningWorldStorage';
import { WorldSeedLibrary } from '@/features/asset-library/worlds/seeds/worldSeedLibrary';
import { SavedWorldLibrary } from '@/features/asset-library/worlds/saved/savedWorldLibrary';
import { WorldSeedShelf } from '@/features/asset-library/worlds/seeds/worldSeedShelf';
import { RandomizeHistory } from '@/features/asset-library/worlds/randomize/randomizeHistory';
import { TemplateLibrary } from '@/features/asset-library/node-groups/templateLibrary';
import { WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import { PieceAssets } from '@/features/asset-library/pieces/pieceAssets';
import { CultureAssets } from '@/features/asset-library/cultures/cultureAssets';
import { debounce } from './debounce';
import { CameraFocus } from '@/features/game/render/camera/cameraFocus';
import { CaptureTool } from '@/features/game/capture/captureTool';
import { HoveredTile } from '@/features/game/hover/hoveredTile';
import { PuzzleWorld } from '@/features/game/puzzles/puzzleWorld';
import { playerCanEnter } from '@/features/game/puzzles/playerCanEnter';
import { isWalkableTile } from '@/features/game/tileWalkability';
import { TileAssets } from '@/features/asset-library/tiles/tileAssets';
import { climbGateFrom } from '@/features/game/climbing';
import { World } from '@/features/game/world';
import { ChangeNotifier } from './changeNotifier';
import type {
  ReadOnlyAssetFolders,
  ReadOnlyCreatureAssets,
  ReadOnlyItemAssets,
  ReadOnlyPipelineStore,
  ReadOnlyPieceAssets,
  ReadOnlyCultureAssets,
  ReadOnlyTemplateLibrary,
  ReadOnlyTileAssets,
  ReadOnlyRunningWorld,
  ReadOnlyWorld,
  ReadOnlyWorldSeedLibrary,
  ReadOnlySavedWorldLibrary,
  ReadOnlyWorldSeedShelf,
} from './readOnlyAssets';
import { WorldRenderers } from './worldRenderers';

const VALUE_TWEAK_DEBOUNCE_MS = 150;
const WORLD_WRITE_BACK_MS = 400;
const SAVE_WORLD = 'save_world';

export interface AppRuntime {
  tileAssets: ReadOnlyTileAssets;
  pieces: ReadOnlyPieceAssets;
  cultures: ReadOnlyCultureAssets;
  creatures: ReadOnlyCreatureAssets;
  items: ReadOnlyItemAssets;
  store: ReadOnlyPipelineStore;
  templates: ReadOnlyTemplateLibrary;
  assetFolders: ReadOnlyAssetFolders;
  worldSeeds: ReadOnlyWorldSeedLibrary;
  savedWorlds: ReadOnlySavedWorldLibrary;
  worldSeedShelf: ReadOnlyWorldSeedShelf;
  runningWorld: ReadOnlyRunningWorld;
  editing: EditablePipelines;
  runningPipeline: EditedPipeline;
  evaluator: PipelineEvaluator;
  sampler: WorldSampler;
  world: ReadOnlyWorld;
  net: MultiplayerSession;
  chatComposer: ChatComposerState;
  playerInventoryPanel: PlayerInventoryPanelState;
  pickupFeed: PickupFeed;
  sim: CreatureSim;
  clock: CreatureClock;
  capture: CaptureTool;
  cameraFocus: CameraFocus;
  hoveredTile: HoveredTile;
  puzzles: PuzzleWorld;
  agentOverlay: ObservedOverlay;
  renderers: WorldRenderers;
  perform(action: string, params?: CommandParams): CommandResult;
  playerMode(): CommandMode;
  setPlayerMode(mode: CommandMode): void;
  subscribeToWorldChange(listener: () => void): () => void;
  applyWorldChange(): void;
  flushPendingTweaks(): void;
}

export function createAppRuntime(): AppRuntime {
  const tileAssets = new TileAssets();
  const templates = new TemplateLibrary();
  const assetFolders = new AssetFolders();
  const worldSeeds = new WorldSeedLibrary();
  const savedWorlds = new SavedWorldLibrary();
  const worldSeedShelf = new WorldSeedShelf(worldSeeds);
  const runningWorld = new RunningWorld(loadRunningWorld());
  attachRunningWorldPersistence(runningWorld);
  const pieces = new PieceAssets();
  const cultures = new CultureAssets();
  const creatures = new CreatureAssets();
  const items = new ItemAssets();
  const store = new PipelineStore(loadStoredPipeline());
  attachPipelinePersistence(store);
  const evaluator = new PipelineEvaluator(store);
  const takenItems = new TakenItemSpawns();
  const sampler = new WorldSampler(
    store,
    evaluator,
    tileAssets,
    pieces,
    items,
    takenItems,
    cultures,
  );
  const groundItems = groundItemsOf(sampler, takenItems);
  const tileIsWalkable = (x: number, y: number) => isWalkableTile(tileAssets, sampler.tileAt(x, y));
  const puzzles = new PuzzleWorld(store, tileIsWalkable);
  const isWalkableAt = (x: number, y: number) => tileIsWalkable(x, y) && !puzzles.blocksAt(x, y);
  const world = new World(
    isWalkableAt,
    (x, y, dx, dy, mayPush) => puzzles.clearTheWay(x, y, dx, dy, mayPush),
    climbGateFrom((x, y) => sampler.elevationAt(x, y)),
  );
  const walkIntoCratesToPushThem = playerCanEnter(isWalkableAt, puzzles, () => ({
    x: world.playerX,
    y: world.playerY,
  }));
  const net = new MultiplayerSession(world, store, walkIntoCratesToPushThem, puzzles, () =>
    redrawIfPuzzlesChanged(),
  );
  const chatComposer = new ChatComposerState();
  const playerInventoryPanel = new PlayerInventoryPanelState();
  const pickupFeed = new PickupFeed();
  const walkOverPickup = new WalkOverPickup({ creatures, items, groundItems }, pickupFeed);
  const sim = new CreatureSim({ sampler, creatureAssets: creatures, world, isWalkableAt });
  const clock = new CreatureClock(sim);
  const agentOverlay = creatureAwareOverlay({ puzzles, sampler, creatures }, sim);
  const renderers = new WorldRenderers();
  const hoveredTile = new HoveredTile();
  const cameraFocus = new CameraFocus();
  const worldChanged = new ChangeNotifier();
  const randomizeHistory = new RandomizeHistory();
  let playerMode: CommandMode = 'god';
  let lastPuzzleRevision = puzzles.state.revision();
  let settlingTheWorld = false;

  const capture = new CaptureTool((region) =>
    perform('capture_region', {
      min_x: region.minX,
      min_y: region.minY,
      max_x: region.maxX,
      max_y: region.maxY,
    }),
  );

  function perform(action: string, params: CommandParams = {}): CommandResult {
    const remote = performPuzzleActionOnServer(action);
    if (remote) return remote;
    const result = performCommandOnce(store, action, params);
    redrawIfPuzzlesChanged();
    if (result.ok && action !== SAVE_WORLD) keepPlayingAfterTheAction.schedule();
    return result;
  }

  function performPuzzleActionOnServer(action: string): CommandResult | null {
    if (!net.isOnline()) return null;
    if (action === 'use' || action === 'use_fixture') {
      net.sendUse();
      return commandSucceeded('working the fixture here');
    }
    if (action === 'reset_room' || action === 'reset_puzzle_room') {
      net.sendResetRoom();
      return commandSucceeded('resetting this chamber');
    }
    return null;
  }

  function performOn(
    edited: PipelineStore,
    action: string,
    params: CommandParams = {},
  ): CommandResult {
    return edited === store ? perform(action, params) : performCommandOnce(edited, action, params);
  }

  function redrawIfPuzzlesChanged(): void {
    if (puzzles.state.revision() === lastPuzzleRevision) return;
    lastPuzzleRevision = puzzles.state.revision();
    renderers.redrawAll();
  }

  function settleTheWorld(change: () => void): void {
    saveEditsAfterTweaks.flushIfPending();
    settlingTheWorld = true;
    try {
      change();
    } finally {
      settlingTheWorld = false;
    }
    lastPuzzleRevision = puzzles.state.revision();
    applyWorldChange();
    renderers.redrawAll();
  }

  function keepWhatThePlayerHasDone(): void {
    if (runningWorld.savedWorldName()) perform(SAVE_WORLD);
  }

  function performCommandOnce(
    store: PipelineStore,
    action: string,
    params: CommandParams,
  ): CommandResult {
    return performCommand(
      {
        store,
        tileAssets,
        pieces,
        cultures,
        creatures,
        items,
        templates,
        assetFolders,
        worldSeeds,
        savedWorlds,
        takenItems,
        runningWorld,
        settleTheWorld,
        randomizeHistory,
        regionSampler: sampler,
        worldSampler: sampler,
        lab: null,
        groundItems,
        puzzles,
        actor: {
          pose: () => ({ x: world.playerX, y: world.playerY, facing: world.facing }),
          snapTo: (x, y, facing) => world.snapTo(x, y, facing),
          tryStep: (dx, dy, mayPush) => world.tryStep(dx, dy, mayPush),
          turn: (eighthTurns) => world.turn(eighthTurns),
          sightRadiusTiles: () => world.sightRadiusTiles,
          setSightRadiusTiles: (radius) => world.setSightRadiusTiles(radius),
        },
      },
      abilityModeFor(action),
      action,
      params,
    );
  }

  function abilityModeFor(action: string): CommandMode {
    if (commandFor(playerMode, action)) return playerMode;
    return isACharacterCommandSharedWithGodView(action) ? 'character' : 'god';
  }

  function isACharacterCommandSharedWithGodView(action: string): boolean {
    const command = commandFor('character', action);
    return command?.group === 'senses' || action === 'turn_left' || action === 'turn_right';
  }

  function announceKeysTakenByWalkingOver(): void {
    for (const key of puzzles.takeKeysAt(world.playerX, world.playerY)) {
      pickupFeed.announceTaken(`${key} (a door key)`);
    }
    redrawIfPuzzlesChanged();
  }

  function applyWorldChange(): void {
    sampler.invalidateStructureOverlay();
    sim.forget();
    world.ensurePlayerOnWalkableGround();
    renderers.redrawAll();
    worldChanged.emit();
  }

  const runningPipeline: EditedPipeline = { store, perform, rendered: true };
  const editing = new EditablePipelines({
    performOn,
    runningPipeline,
    runningWorld,
    worldSeedNamed: (name) => worldSeedShelf.byName(name),
    groupNamed: (name) => templates.byName(name),
  });

  const worldEdits = runningWorldEdits({
    store,
    worldSeeds: worldSeedShelf,
    savedWorlds,
    runningWorld,
    perform,
  });

  const applyAfterTweaks = debounce(applyWorldChange, VALUE_TWEAK_DEBOUNCE_MS);
  const saveEditsAfterTweaks = debounce(worldEdits.saveWhatIsOpen, WORLD_WRITE_BACK_MS);
  const keepPlayingAfterTheAction = debounce(keepWhatThePlayerHasDone, WORLD_WRITE_BACK_MS);
  store.onChange((change) => {
    if (!net.isApplyingARemotePipeline()) saveEditsAfterTweaks.schedule();
    return change === 'structure' ? applyWorldChange() : applyAfterTweaks.schedule();
  });
  tileAssets.onChange(applyWorldChange);
  pieces.onChange(applyWorldChange);
  cultures.onChange(applyWorldChange);
  creatures.onChange(applyWorldChange);
  items.onChange(applyWorldChange);
  world.on('player-moved', () => {
    if (settlingTheWorld) return;
    walkOverPickup.onSteppedOnto(world.playerX, world.playerY);
    announceKeysTakenByWalkingOver();
    keepPlayingAfterTheAction.schedule();
  });
  world.on('player-moved', () => renderers.recenterAll());
  world.on('player-turned', () => renderers.recenterAll());
  worldEdits.runSomethingIfNothingIsRunning();

  return {
    tileAssets,
    templates,
    assetFolders,
    worldSeeds,
    worldSeedShelf,
    savedWorlds,
    runningWorld,
    editing,
    runningPipeline,
    pieces,
    cultures,
    creatures,
    items,
    store,
    evaluator,
    sampler,
    world,
    net,
    chatComposer,
    playerInventoryPanel,
    pickupFeed,
    sim,
    clock,
    capture,
    cameraFocus,
    hoveredTile,
    puzzles,
    agentOverlay,
    renderers,
    perform,
    playerMode: () => playerMode,
    setPlayerMode: (mode) => (playerMode = mode),
    subscribeToWorldChange: worldChanged.subscribe,
    applyWorldChange,
    flushPendingTweaks: applyAfterTweaks.flushIfPending,
  };
}

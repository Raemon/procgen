import type { CommandParams } from '@/features/app-shell/runtime/commands/command';
import { assetId } from '@/features/asset-library/asset';
import { emptyPipeline } from '@/features/asset-library/worlds/pipeline/pipelineState';
import { PipelineStore } from '@/features/asset-library/worlds/pipeline/pipelineStore';
import { PipelineEvaluator } from '@/features/asset-library/worlds/eval/evaluator';
import { WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import { WorldLab } from '@/features/asset-library/worlds/lab/worldLab';
import { RandomizeHistory } from '@/features/asset-library/worlds/randomize/randomizeHistory';
import { TemplateLibrary } from '@/features/asset-library/node-groups/templateLibrary';
import { RunningWorld } from '@/features/asset-library/worlds/presets/runningWorld';
import { WorldPresetLibrary } from '@/features/asset-library/worlds/presets/worldPresetLibrary';
import { AssetFolders } from '@/features/asset-library/folders/assetFolders';
import { CreatureAssets } from '@/features/asset-library/creatures/creatureAssets';
import { ItemAssets } from '@/features/asset-library/items/itemAssets';
import { NO_GROUND_ITEMS } from '@/features/asset-library/items/pickups/groundItems';
import { PieceAssets } from '@/features/asset-library/pieces/pieceAssets';
import { CultureAssets } from '@/features/asset-library/cultures/cultureAssets';
import { MAX_STORY_LAYERS, piecesBoundToRole } from '@/features/asset-library/cultures/cultureDef';
import { TileAssets } from '@/features/asset-library/tiles/tileAssets';
import { newTileWithId, type TileDef } from '@/features/asset-library/tiles/tileDef';
import { PuzzleWorld } from '@/features/game/puzzles/puzzleWorld';
import { turnedFacing, type FacingIndex } from '@/features/game/facing';
import {
  DEFAULT_CHARACTER_SIGHT_RADIUS_TILES,
  MAX_CHARACTER_SIGHT_RADIUS_TILES,
  MIN_CHARACTER_SIGHT_RADIUS_TILES,
  clampSightRadiusTiles,
} from '@/features/game/vision/characterSight';
import { commandsForMode, commandFor } from '@/features/app-shell/runtime/commands/commandCatalog';
import { performCommand } from '@/features/app-shell/runtime/commands/performCommand';
import { everyCommand } from '../api/docs/apiDocs';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';

function abilityWorld(initialTiles: TileDef[] = []) {
  const store = new PipelineStore(emptyPipeline());
  const abilityTiles = new TileAssets(initialTiles);
  const pieces = new PieceAssets();
  const cultures = new CultureAssets();
  const pose = { x: 0, y: 0, facing: 0 as FacingIndex };
  const sight: { radius: number } = { radius: DEFAULT_CHARACTER_SIGHT_RADIUS_TILES };
  const sampler = new WorldSampler(store, new PipelineEvaluator(store), abilityTiles, pieces);
  const context = {
    store,
    tileAssets: abilityTiles,
    pieces,
    cultures,
    creatures: new CreatureAssets(),
    items: new ItemAssets(),
    templates: new TemplateLibrary({ templates: [], hiddenBuiltIns: [] }),
    assetFolders: new AssetFolders({ folders: [], placements: {} }),
    worldPresets: new WorldPresetLibrary({ presets: [], hiddenExamples: [] }),
    runningWorld: new RunningWorld(),
    randomizeHistory: new RandomizeHistory(),
    groundItems: NO_GROUND_ITEMS,
    puzzles: new PuzzleWorld(store, () => true),
    regionSampler: {
      tileAt: () => assetId<'tiles'>(0),
      elevationAt: () => 0,
      packedVoxelColumnAt: () => null,
    },
    worldSampler: sampler,
    lab: new WorldLab(),
    actor: {
      pose: () => pose,
      tryStep: (dx: number, dy: number) => ((pose.x += dx), (pose.y += dy), true),
      tryJump: (dx: number, dy: number) => ((pose.x += dx * 2), (pose.y += dy * 2), true),
      turn: (turns: number) => (pose.facing = turnedFacing(pose.facing, turns)),
      sightRadiusTiles: () => sight.radius,
      setSightRadiusTiles: (radius: number) => (sight.radius = clampSightRadiusTiles(radius)),
    },
  };
  return { context, store, pose, sight, pieces, tileAssets: abilityTiles };
}

function steppingWorld(elevationAt: (x: number, y: number) => number) {
  const ground = abilityWorld();
  return {
    ...ground.context,
    worldSampler: {
      tileAt: () => assetId<'tiles'>(0),
      elevationAt,
      markersIn: () => [],
      itemSpawnsIn: () => [],
    } as unknown as WorldSampler,
    actor: { ...ground.context.actor, tryStep: () => false, tryJump: () => false },
  };
}

export function checkCommandDispatch(check: CheckReporter): void {
  const commands = abilityWorld();
  const act = (mode: 'god' | 'character', action: string, params: CommandParams = {}) =>
    performCommand(commands.context, mode, action, params);
  const addedCulture = () => {
    act('god', 'add_culture');
    const cultures = commands.context.cultures.all();
    return cultures[cultures.length - 1]!;
  };
  const addedPiece = () => {
    act('god', 'add_piece');
    const pieces = commands.pieces.all();
    return pieces[pieces.length - 1]!;
  };

  check('an command is refused to a mode that does not own it', (() => {
    const characterCompass = act('character', 'step_north');
    const godTurn = act('god', 'turn_left');
    const characterEdit = act('character', 'add_node', { type: 'noiseField' });
    return (
      !characterCompass.ok && characterCompass.code === 'unknown_action' &&
      !godTurn.ok && godTurn.code === 'unknown_action' &&
      !characterEdit.ok && characterEdit.code === 'unknown_action'
    );
  })());
  check('an unknown action lists the ones the mode does have', (() => {
    const result = act('god', 'set_fire_to_everything');
    return !result.ok && result.hint.includes('add_node');
  })());
  check('a missing required param is named, not guessed at', (() => {
    const result = act('god', 'set_param', { node_id: 'n1' });
    return !result.ok && result.code === 'bad_request' && result.hint.includes('param');
  })());
  check('moving and turning go through the same registry the API uses', (() => {
    const moved = act('god', 'step_east');
    const turned = act('character', 'turn_right');
    return moved.ok && commands.pose.x === 1 && turned.ok && commands.pose.facing === 1;
  })());
  check('a step refused by high ground names the levels in its hint', (() => {
    const steep = steppingWorld((x) => (x === 0 ? 0.4 : 2.6));
    const result = performCommand(steep, 'god', 'step_east', {});
    return (
      !result.ok &&
      result.code === 'blocked' &&
      result.hint.includes('level 2.5') &&
      result.hint.includes('your level 0.5') &&
      result.hint.includes('climbs at most 0.5')
    );
  })());
  check('a step refused on flat walkable ground blames an obstacle instead', (() => {
    const walled = steppingWorld(() => 0);
    const result = performCommand(walled, 'god', 'step_east', {});
    return !result.ok && result.code === 'blocked' && result.hint.includes('something solid at (1,0)');
  })());
  check('set_sight_radius is a character power, and god mode has no such knob', (() => {
    const widened = act('character', 'set_sight_radius', { radius_tiles: 24 });
    const inGodMode = act('god', 'set_sight_radius', { radius_tiles: 24 });
    return (
      widened.ok &&
      widened.summary.includes('24') &&
      commands.sight.radius === 24 &&
      !inGodMode.ok &&
      inGodMode.code === 'unknown_action'
    );
  })());
  check('set_sight_radius clamps rather than refusing, and says so', (() => {
    const tooFar = act('character', 'set_sight_radius', { radius_tiles: 5000 });
    const clampedTo = commands.sight.radius;
    const tooNear = act('character', 'set_sight_radius', { radius_tiles: -10 });
    const narrowedTo = commands.sight.radius;
    const back = act('character', 'set_sight_radius', {
      radius_tiles: DEFAULT_CHARACTER_SIGHT_RADIUS_TILES,
    });
    return (
      tooFar.ok && tooFar.summary.includes('clamped') && clampedTo === MAX_CHARACTER_SIGHT_RADIUS_TILES &&
      tooNear.ok && narrowedTo === MIN_CHARACTER_SIGHT_RADIUS_TILES &&
      back.ok && commands.sight.radius === DEFAULT_CHARACTER_SIGHT_RADIUS_TILES
    );
  })());
  check('set_sight_radius refuses a radius that is not a number', (() => {
    const result = act('character', 'set_sight_radius', { radius_tiles: 'far' });
    return !result.ok && result.code === 'invalid_value';
  })());
  check('add_node rejects an unknown type', (() => {
    const result = act('god', 'add_node', { type: 'noSuchThing' });
    return !result.ok && result.code === 'unknown_node_type';
  })());
  check('add_node creates and reports the node', (() => {
    const result = act('god', 'add_node', { type: 'noiseField' });
    return result.ok && commands.store.nodes().length === 1;
  })());
  const noiseId = commands.store.nodes()[0]!.id;
  check('set_param clamps a knob to its range', (() => {
    const result = act('god', 'set_param', { node_id: noiseId, param: 'scale', value: 999 });
    return result.ok && commands.store.nodeById(noiseId)!.params.scale === 0.3;
  })());
  check('set_param names the real params on a miss', (() => {
    const result = act('god', 'set_param', { node_id: noiseId, param: 'nope', value: 1 });
    return !result.ok && result.code === 'unknown_param' && result.hint.includes('scale');
  })());
  check('threshold auto-wires to the noise field when added', (() => {
    const result = act('god', 'add_node', { type: 'thresholdTiles' });
    const threshold = commands.store.nodes()[1];
    return result.ok && threshold?.type === 'thresholdTiles' && Object.values(threshold.inputs).includes(noiseId);
  })());
  const thresholdId = commands.store.nodes()[1]!.id;
  check('wire_input refuses a later source for an earlier node', (() => {
    const result = act('god', 'wire_input', { node_id: noiseId, input: 'field', source_node_id: thresholdId });
    return !result.ok && (result.code === 'invalid_wire' || result.code === 'unknown_param');
  })());
  check('set_display refuses a mode the output kind cannot take', (() => {
    const result = act('god', 'set_display', { node_id: noiseId, display: 'tileLayer' });
    return !result.ok && result.code === 'invalid_display';
  })());
  check('set_display binds elevation with a height scale', (() => {
    const result = act('god', 'set_display', { node_id: noiseId, display: 'elevation', height_scale: 5 });
    const display = commands.store.nodeById(noiseId)!.display;
    return result.ok && display.mode === 'elevation' && display.heightScale === 5;
  })());
  check('set_display keeps the fields you leave out', (() => {
    act('god', 'set_display', { node_id: noiseId, display: 'elevation', height_scale: 7 });
    const kept = act('god', 'set_display', { node_id: noiseId, display: 'elevation' });
    const display = commands.store.nodeById(noiseId)!.display;
    return kept.ok && display.mode === 'elevation' && display.heightScale === 7;
  })());
  check('set_seed reseeds the pipeline', (() => {
    const result = act('god', 'set_seed', { seed: 777 });
    return result.ok && commands.store.seed() === 777;
  })());
  check('set_display rejects a piece id the piece assets do not have', (() => {
    const added = act('god', 'add_node', { type: 'scatterPoints' });
    const points = commands.store.nodes()[commands.store.nodes().length - 1]!;
    const bad = act('god', 'set_display', { node_id: points.id, display: 'pieces', piece_id: 9999 });
    const good = act('god', 'set_display', { node_id: points.id, display: 'creatures', creature_id: -1 });
    return added.ok && !bad.ok && bad.code === 'invalid_value' && good.ok;
  })());
  check('remove_node deletes and reports', (() => {
    const result = act('god', 'remove_node', { node_id: thresholdId });
    return result.ok && commands.store.nodes().every((node) => node.id !== thresholdId);
  })());
  check('tiles can be created and edited through commands', (() => {
    const before = commands.tileAssets.all().length;
    const added = act('god', 'add_tile');
    const tileId = commands.tileAssets.all()[commands.tileAssets.all().length - 1]!.id;
    const named = act('god', 'update_tile', { tile_id: tileId, name: 'test tile', walkable: 0 });
    const tile = commands.tileAssets.byId(tileId)!;
    return (
      added.ok && named.ok &&
      commands.tileAssets.all().length === before + 1 &&
      tile.name === 'test tile' && tile.walkable === false
    );
  })());
  check('pieces can be built voxel by voxel through commands', (() => {
    const added = act('god', 'add_piece');
    const piece = commands.pieces.all()[commands.pieces.all().length - 1]!;
    const sized = act('god', 'resize_piece', { piece_id: piece.id, width: 3, depth: 3, layers: 2 });
    const groundTile = commands.tileAssets.all()[0]!.id;
    const painted = act('god', 'paint_piece', { piece_id: piece.id, x: 1, y: 1, layer: 1, tile_id: groundTile });
    const outside = act('god', 'paint_piece', { piece_id: piece.id, x: 9, y: 9, layer: 0, tile_id: groundTile });
    const filled = act('god', 'fill_piece_layer', { piece_id: piece.id, layer: 0, tile_id: groundTile });
    const after = commands.pieces.byId(piece.id)!;
    return (
      added.ok && sized.ok && painted.ok && filled.ok && !outside.ok &&
      after.width === 3 && after.layers === 2 &&
      after.voxels.filter((voxel) => voxel === groundTile).length === 10
    );
  })());
  check('creatures can be created and tuned through commands', (() => {
    const added = act('god', 'add_creature');
    const creature = commands.context.creatures.all()[commands.context.creatures.all().length - 1]!;
    const tuned = act('god', 'update_creature', { creature_id: creature.id, behavior: 3, speed: 2.5 });
    const badBehavior = act('god', 'update_creature', { creature_id: creature.id, behavior: 99 });
    const after = commands.context.creatures.byId(creature.id)!;
    return added.ok && tuned.ok && !badBehavior.ok && after.behavior === 3 && after.speed === 2.5;
  })());
  check('a culture can be named, tiled, proportioned and bound to pieces through commands', (() => {
    const culture = addedCulture();
    const piece = commands.pieces.all()[0]!;
    const tileId = commands.tileAssets.all()[0]!.id;
    const named = act('god', 'rename_culture', { culture_id: culture.id, name: 'hill folk' });
    const tiled = act('god', 'set_culture_tiles', { culture_id: culture.id, wall_tile: tileId });
    const shaped = act('god', 'set_culture_numbers', { culture_id: culture.id, roof_style: 1, story_layers: 99 });
    const bound = act('god', 'bind_culture_role', { culture_id: culture.id, role: 'door', piece_ids: [piece.id] });
    const badRole = act('god', 'bind_culture_role', { culture_id: culture.id, role: 'gargoyle', piece_ids: [] });
    const after = commands.context.cultures.byId(culture.id)!;
    return (
      named.ok && tiled.ok && shaped.ok && bound.ok && !badRole.ok &&
      after.name === 'hill folk' && after.wallTileId === tileId &&
      after.roofStyle === 1 && after.storyLayers === MAX_STORY_LAYERS &&
      JSON.stringify(after.roleBindings.door) === JSON.stringify([piece.id])
    );
  })());
  check('removing a culture takes it out of the culture assets', (() => {
    const culture = addedCulture();
    const removed = act('god', 'remove_culture', { culture_id: culture.id });
    const again = act('god', 'remove_culture', { culture_id: culture.id });
    return (
      removed.ok && !again.ok && again.code === 'unknown_culture' &&
      commands.context.cultures.byId(culture.id) === undefined
    );
  })());
  check('deleting a piece unbinds it from the culture roles it was bound to, so no binding dangles', (() => {
    const culture = addedCulture();
    const piece = addedPiece();
    const bound = act('god', 'bind_culture_role', {
      culture_id: culture.id,
      role: 'door',
      piece_ids: [piece.id],
    });
    const removed = act('god', 'remove_piece', { piece_id: piece.id });
    const after = commands.context.cultures.byId(culture.id)!;
    return bound.ok && removed.ok && piecesBoundToRole(after, 'door').length === 0;
  })());
  check('presets and templates round-trip through commands', (() => {
    const saved = act('god', 'save_preset', { name: 'check preset' });
    const nodeIds = commands.store.nodes().map((node) => node.id);
    const template = act('god', 'save_template', { name: 'check template', node_ids: nodeIds });
    const stamped = act('god', 'stamp_template', { name: 'check template' });
    const loaded = act('god', 'load_preset', { name: 'check preset' });
    const unknown = act('god', 'load_preset', { name: 'no such world' });
    return (
      saved.ok && template.ok && stamped.ok && loaded.ok &&
      !unknown.ok && unknown.code === 'unknown_preset' && unknown.hint.includes('check preset')
    );
  })());
  check('editing a built-in world or node group takes its name over, and deleting yours gives it back', (() => {
    const nodeIds = commands.store.nodes().map((node) => node.id);
    const overExample = act('god', 'save_preset', { name: 'volcanic islands' });
    const overBuiltIn = act('god', 'save_template', { name: 'tectonic plates', node_ids: nodeIds });
    const edited = commands.context.templates.byName('tectonic plates');
    const dropped = act('god', 'delete_template', { name: 'tectonic plates' });
    const shipped = commands.context.templates.byName('tectonic plates');
    return (
      overExample.ok && overBuiltIn.ok && dropped.ok &&
      edited!.nodes.length === nodeIds.length &&
      shipped !== undefined && shipped.nodes.length !== nodeIds.length
    );
  })());
  check('deleting a built-in world takes it off the shelf without making its name unloadable', (() => {
    const deleted = act('god', 'delete_preset', { name: 'volcanic islands' });
    const stillLoadable = act('god', 'load_preset', { name: 'volcanic islands' });
    return (
      deleted.ok &&
      stillLoadable.ok &&
      commands.context.worldPresets.hiddenExamples().includes('volcanic islands')
    );
  })());
  check('run_world puts a world on screen and names it as the one running', (() => {
    const ran = act('god', 'run_world', { name: 'check preset' });
    return ran.ok && commands.context.runningWorld.name() === 'check preset';
  })());
  check('a roll can be seeded and undone', (() => {
    const before = JSON.stringify(commands.store.snapshot());
    const rolled = act('god', 'randomize_sliders', { seed: 42 });
    const undone = act('god', 'undo_randomize');
    return rolled.ok && undone.ok && JSON.stringify(commands.store.snapshot()) === before;
  })());
  check('an unplayable seeded roll is refused without changing the world or undo history', (() => {
    const wallId = assetId<'tiles'>(0);
    const sealed = abilityWorld([{ ...newTileWithId(wallId), walkable: false }]);
    const sealedAct = (action: string, params: CommandParams = {}) =>
      performCommand(sealed.context, 'god', action, params);
    sealedAct('add_node', { type: 'constantField' });
    sealedAct('add_node', { type: 'thresholdTiles' });
    const threshold = sealed.store.nodes()[1]!;
    sealedAct('set_param', { node_id: threshold.id, param: 'belowTile', value: wallId });
    sealedAct('set_param', { node_id: threshold.id, param: 'aboveTile', value: wallId });
    const before = JSON.stringify(sealed.store.snapshot());
    const rolled = sealedAct('randomize_seed', { seed: 42 });
    return (
      !rolled.ok &&
      rolled.code === 'unplayable_world' &&
      JSON.stringify(sealed.store.snapshot()) === before &&
      !sealed.context.randomizeHistory.canUndo()
    );
  })());
  check('rerolling the seed regenerates the world without touching a single node', (() => {
    act('god', 'load_preset', { name: 'check preset' });
    const before = commands.store.snapshot();
    const beforeNodes = JSON.stringify(before.nodes);
    const beforeSeed = before.seed;
    const rolled = act('god', 'randomize_seed');
    const after = commands.store.snapshot();
    const undone = act('god', 'undo_randomize');
    return (
      rolled.ok &&
      rolled.summary.includes('paces') &&
      JSON.stringify(after.nodes) === beforeNodes &&
      after.seed !== beforeSeed &&
      undone.ok &&
      commands.store.snapshot().seed === beforeSeed
    );
  })());
  check('an unseeded roll lands the player with room to walk and can be undone', (() => {
    const before = JSON.stringify(commands.store.snapshot());
    const rolled = act('god', 'randomize_world');
    const undone = act('god', 'undo_randomize');
    return (
      rolled.ok &&
      rolled.summary.includes('paces') &&
      undone.ok &&
      JSON.stringify(commands.store.snapshot()) === before
    );
  })());
  check('capture_region lifts world tiles into a new piece', (() => {
    const before = commands.pieces.all().length;
    const captured = act('god', 'capture_region', { min_x: 0, min_y: 0, max_x: 3, max_y: 3 });
    return captured.ok && commands.pieces.all().length === before + 1;
  })());
  check('a jump refused at both landings says what stood in the way of each', (() => {
    const walled = steppingWorld(() => 0);
    const result = performCommand(walled, 'character', 'jump_forward', {});
    return (
      !result.ok &&
      result.code === 'blocked' &&
      result.hint.includes('(0,-2)') &&
      result.hint.includes('(0,-1)')
    );
  })());
  check('every command is reachable through the API dispatcher', everyCommand().every((spec) => commandFor(spec.mode, spec.action) === spec));
  check('character mode owns nothing but its own movement and senses, never the world editor', commandsForMode('character').every((spec) => spec.group === 'movement' || spec.group === 'senses'));
  check('character mode can widen its own sight and nothing else senses-shaped', commandsForMode('character').filter((spec) => spec.group === 'senses').map((spec) => spec.action).join() === 'set_sight_radius');
}

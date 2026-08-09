import '../abilities/index';
import { emptyPipeline } from '../procgen/pipeline/pipelineState';
import { PipelineStore } from '../procgen/pipeline/pipelineStore';
import { RandomizeHistory } from '../procgen/randomize/randomizeHistory';
import { TemplateLibrary } from '../procgen/templates/templateLibrary';
import { WorldPresetLibrary } from '../procgen/presets/worldPresetLibrary';
import { CreatureAssets } from '../assets/creatures/creatureAssets';
import { ItemAssets } from '../assets/items/itemAssets';
import { NO_GROUND_ITEMS } from '../assets/items/pickups/groundItems';
import { PieceAssets } from '../assets/pieces/pieceAssets';
import { CultureAssets } from '../assets/cultures/cultureAssets';
import { TileAssets } from '../assets/tiles/tileAssets';
import { PuzzleWorld } from '../world/puzzles/puzzleWorld';
import { turnedFacing, type FacingIndex } from '../world/facing';
import {
  DEFAULT_CHARACTER_SIGHT_RADIUS_TILES,
  MAX_CHARACTER_SIGHT_RADIUS_TILES,
  MIN_CHARACTER_SIGHT_RADIUS_TILES,
  clampSightRadiusTiles,
} from '../world/vision/characterSight';
import { abilitiesForMode, abilityFor } from '../abilities/abilityRegistry';
import { performAbility } from '../abilities/performAbility';
import { everyAbility } from '../api/docs/apiDocs';
import type { CheckReporter } from './checkReporter';

function abilityWorld() {
  const store = new PipelineStore(emptyPipeline());
  const abilityTiles = new TileAssets();
  const pieces = new PieceAssets();
  const cultures = new CultureAssets();
  const pose = { x: 0, y: 0, facing: 0 as FacingIndex };
  const sight: { radius: number } = { radius: DEFAULT_CHARACTER_SIGHT_RADIUS_TILES };
  const context = {
    store,
    tileAssets: abilityTiles,
    pieces,
    cultures,
    creatures: new CreatureAssets(),
    items: new ItemAssets(),
    templates: new TemplateLibrary([]),
    worldPresets: new WorldPresetLibrary([]),
    randomizeHistory: new RandomizeHistory(),
    groundItems: NO_GROUND_ITEMS,
    puzzles: new PuzzleWorld(store, () => true),
    regionSampler: {
      tileAt: () => 0,
      elevationAt: () => 0,
      packedVoxelColumnAt: () => null,
    },
    actor: {
      pose: () => pose,
      tryStep: (dx: number, dy: number) => ((pose.x += dx), (pose.y += dy), true),
      turn: (turns: number) => (pose.facing = turnedFacing(pose.facing, turns)),
      sightRadiusTiles: () => sight.radius,
      setSightRadiusTiles: (radius: number) => (sight.radius = clampSightRadiusTiles(radius)),
    },
  };
  return { context, store, pose, sight, pieces, tileAssets: abilityTiles };
}

export function checkAbilityDispatch(check: CheckReporter): void {
  const abilities = abilityWorld();
  const act = (mode: 'god' | 'character', action: string, params: Record<string, unknown> = {}) =>
    performAbility(abilities.context, mode, action, params);

  check('an ability is refused to a mode that does not own it', (() => {
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
    return moved.ok && abilities.pose.x === 1 && turned.ok && abilities.pose.facing === 1;
  })());
  check('set_sight_radius is a character power, and god mode has no such knob', (() => {
    const widened = act('character', 'set_sight_radius', { radius_tiles: 24 });
    const inGodMode = act('god', 'set_sight_radius', { radius_tiles: 24 });
    return (
      widened.ok &&
      widened.summary.includes('24') &&
      abilities.sight.radius === 24 &&
      !inGodMode.ok &&
      inGodMode.code === 'unknown_action'
    );
  })());
  check('set_sight_radius clamps rather than refusing, and says so', (() => {
    const tooFar = act('character', 'set_sight_radius', { radius_tiles: 5000 });
    const clampedTo = abilities.sight.radius;
    const tooNear = act('character', 'set_sight_radius', { radius_tiles: -10 });
    const narrowedTo = abilities.sight.radius;
    const back = act('character', 'set_sight_radius', {
      radius_tiles: DEFAULT_CHARACTER_SIGHT_RADIUS_TILES,
    });
    return (
      tooFar.ok && tooFar.summary.includes('clamped') && clampedTo === MAX_CHARACTER_SIGHT_RADIUS_TILES &&
      tooNear.ok && narrowedTo === MIN_CHARACTER_SIGHT_RADIUS_TILES &&
      back.ok && abilities.sight.radius === DEFAULT_CHARACTER_SIGHT_RADIUS_TILES
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
    return result.ok && abilities.store.nodes().length === 1;
  })());
  const noiseId = abilities.store.nodes()[0]!.id;
  check('set_param clamps a knob to its range', (() => {
    const result = act('god', 'set_param', { node_id: noiseId, param: 'scale', value: 999 });
    return result.ok && abilities.store.nodeById(noiseId)!.params.scale === 0.3;
  })());
  check('set_param names the real params on a miss', (() => {
    const result = act('god', 'set_param', { node_id: noiseId, param: 'nope', value: 1 });
    return !result.ok && result.code === 'unknown_param' && result.hint.includes('scale');
  })());
  check('threshold auto-wires to the noise field when added', (() => {
    const result = act('god', 'add_node', { type: 'thresholdTiles' });
    const threshold = abilities.store.nodes()[1];
    return result.ok && threshold?.type === 'thresholdTiles' && Object.values(threshold.inputs).includes(noiseId);
  })());
  const thresholdId = abilities.store.nodes()[1]!.id;
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
    const display = abilities.store.nodeById(noiseId)!.display;
    return result.ok && display.mode === 'elevation' && display.heightScale === 5;
  })());
  check('set_display keeps the fields you leave out', (() => {
    act('god', 'set_display', { node_id: noiseId, display: 'elevation', height_scale: 7 });
    const kept = act('god', 'set_display', { node_id: noiseId, display: 'elevation' });
    const display = abilities.store.nodeById(noiseId)!.display;
    return kept.ok && display.mode === 'elevation' && display.heightScale === 7;
  })());
  check('set_seed reseeds the pipeline', (() => {
    const result = act('god', 'set_seed', { seed: 777 });
    return result.ok && abilities.store.seed() === 777;
  })());
  check('set_display rejects a piece id the piece assets do not have', (() => {
    const added = act('god', 'add_node', { type: 'scatterPoints' });
    const points = abilities.store.nodes()[abilities.store.nodes().length - 1]!;
    const bad = act('god', 'set_display', { node_id: points.id, display: 'pieces', piece_id: 9999 });
    const good = act('god', 'set_display', { node_id: points.id, display: 'creatures', creature_id: -1 });
    return added.ok && !bad.ok && bad.code === 'invalid_value' && good.ok;
  })());
  check('remove_node deletes and reports', (() => {
    const result = act('god', 'remove_node', { node_id: thresholdId });
    return result.ok && abilities.store.nodes().every((node) => node.id !== thresholdId);
  })());
  check('tiles can be created and edited through abilities', (() => {
    const before = abilities.tileAssets.all().length;
    const added = act('god', 'add_tile');
    const tileId = abilities.tileAssets.all()[abilities.tileAssets.all().length - 1]!.id;
    const named = act('god', 'update_tile', { tile_id: tileId, name: 'test tile', walkable: 0 });
    const tile = abilities.tileAssets.byId(tileId)!;
    return (
      added.ok && named.ok &&
      abilities.tileAssets.all().length === before + 1 &&
      tile.name === 'test tile' && tile.walkable === false
    );
  })());
  check('pieces can be built voxel by voxel through abilities', (() => {
    const added = act('god', 'add_piece');
    const piece = abilities.pieces.all()[abilities.pieces.all().length - 1]!;
    const sized = act('god', 'resize_piece', { piece_id: piece.id, width: 3, depth: 3, layers: 2 });
    const groundTile = abilities.tileAssets.all()[0]!.id;
    const painted = act('god', 'paint_piece', { piece_id: piece.id, x: 1, y: 1, layer: 1, tile_id: groundTile });
    const outside = act('god', 'paint_piece', { piece_id: piece.id, x: 9, y: 9, layer: 0, tile_id: groundTile });
    const filled = act('god', 'fill_piece_layer', { piece_id: piece.id, layer: 0, tile_id: groundTile });
    const after = abilities.pieces.byId(piece.id)!;
    return (
      added.ok && sized.ok && painted.ok && filled.ok && !outside.ok &&
      after.width === 3 && after.layers === 2 &&
      after.voxels.filter((voxel) => voxel === groundTile).length === 10
    );
  })());
  check('creatures can be created and tuned through abilities', (() => {
    const added = act('god', 'add_creature');
    const creature = abilities.context.creatures.all()[abilities.context.creatures.all().length - 1]!;
    const tuned = act('god', 'update_creature', { creature_id: creature.id, behavior: 3, speed: 2.5 });
    const badBehavior = act('god', 'update_creature', { creature_id: creature.id, behavior: 99 });
    const after = abilities.context.creatures.byId(creature.id)!;
    return added.ok && tuned.ok && !badBehavior.ok && after.behavior === 3 && after.speed === 2.5;
  })());
  check('a culture can be named, tiled, proportioned and bound to pieces through abilities', (() => {
    const added = act('god', 'add_culture');
    const culture = abilities.context.cultures.all()[abilities.context.cultures.all().length - 1]!;
    const piece = abilities.pieces.all()[0]!;
    const tileId = abilities.tileAssets.all()[0]!.id;
    const named = act('god', 'rename_culture', { culture_id: culture.id, name: 'hill folk' });
    const tiled = act('god', 'set_culture_tiles', { culture_id: culture.id, wall_tile: tileId });
    const shaped = act('god', 'set_culture_numbers', { culture_id: culture.id, roof_style: 1, story_layers: 99 });
    const bound = act('god', 'bind_culture_role', { culture_id: culture.id, role: 'door', piece_ids: [piece.id] });
    const badRole = act('god', 'bind_culture_role', { culture_id: culture.id, role: 'gargoyle', piece_ids: [] });
    const after = abilities.context.cultures.byId(culture.id)!;
    return (
      added.ok && named.ok && tiled.ok && shaped.ok && bound.ok && !badRole.ok &&
      after.name === 'hill folk' && after.wallTileId === tileId &&
      after.roofStyle === 1 && after.storyLayers === 6 &&
      JSON.stringify(after.roleBindings.door) === JSON.stringify([piece.id])
    );
  })());
  check('removing a culture takes it out of the culture assets', (() => {
    const culture = abilities.context.cultures.all()[abilities.context.cultures.all().length - 1]!;
    const removed = act('god', 'remove_culture', { culture_id: culture.id });
    const again = act('god', 'remove_culture', { culture_id: culture.id });
    return removed.ok && !again.ok && again.code === 'unknown_culture';
  })());
  check('presets and templates round-trip through abilities', (() => {
    const saved = act('god', 'save_preset', { name: 'check preset' });
    const nodeIds = abilities.store.nodes().map((node) => node.id);
    const template = act('god', 'save_template', { name: 'check template', node_ids: nodeIds });
    const stamped = act('god', 'stamp_template', { name: 'check template' });
    const loaded = act('god', 'load_preset', { name: 'check preset' });
    const unknown = act('god', 'load_preset', { name: 'no such world' });
    return (
      saved.ok && template.ok && stamped.ok && loaded.ok &&
      !unknown.ok && unknown.code === 'unknown_preset' && unknown.hint.includes('check preset')
    );
  })());
  check('a roll can be seeded and undone', (() => {
    const before = JSON.stringify(abilities.store.snapshot());
    const rolled = act('god', 'randomize_sliders', { seed: 42 });
    const undone = act('god', 'undo_randomize');
    return rolled.ok && undone.ok && JSON.stringify(abilities.store.snapshot()) === before;
  })());
  check('capture_region lifts world tiles into a new piece', (() => {
    const before = abilities.pieces.all().length;
    const captured = act('god', 'capture_region', { min_x: 0, min_y: 0, max_x: 3, max_y: 3 });
    return captured.ok && abilities.pieces.all().length === before + 1;
  })());
  check('every ability is reachable through the API dispatcher', everyAbility().every((spec) => abilityFor(spec.mode, spec.action) === spec));
  check('character mode owns nothing but its own movement and senses, never the world editor', abilitiesForMode('character').every((spec) => spec.group === 'movement' || spec.group === 'senses'));
  check('character mode can widen its own sight and nothing else senses-shaped', abilitiesForMode('character').filter((spec) => spec.group === 'senses').map((spec) => spec.action).join() === 'set_sight_radius');
}

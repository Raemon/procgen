import '../abilities/index';
import { performAbility } from '../abilities/performAbility';
import { DEFAULT_CHARACTER_SIGHT_RADIUS_TILES } from '../world/vision/characterSight';
import type { AbilityContext, AbilityResult } from '../abilities/ability';
import { humanoidBillboard } from '../assets/creatures/art/humanoidBillboard';
import { WANDERING_TRADER_PALETTE } from '../assets/creatures/art/humanoidPalette';
import {
  CHARACTER_ANIMATIONS,
  CHARACTER_ROTATIONS,
  blankCharacterBillboard,
  frameIndexAt,
  framesOf,
  hasAnyFrame,
  type CharacterBillboard,
} from '../assets/characters/characterBillboard';
import { headingRadians, viewRelativeRotation } from '../assets/characters/characterFacing';
import { characterFrame } from '../assets/characters/characterFrame';
import { sanitizeCharacterBillboard } from '../assets/characters/sanitizeCharacterBillboard';
import { CreatureAssets } from '../assets/creatures/creatureAssets';
import { NO_GROUND_ITEMS } from '../assets/items/pickups/groundItems';
import { PuzzleWorld } from '../world/puzzles/puzzleWorld';
import { creaturesFromStoredJson } from '../assets/creatures/creatureStorage';
import { CHARACTER } from '../assets/creatures/entityKinds';
import { moveCreatureTowardTarget } from '../world/creatureSim/moveCreatureTowardTarget';
import { spawnedCreature } from '../world/creatureSim/creatureInstance';
import { ItemAssets } from '../assets/items/itemAssets';
import { PrefabAssets } from '../assets/prefabs/prefabAssets';
import { emptyPipeline } from '../procgen/pipeline/pipelineState';
import { PipelineStore } from '../procgen/pipeline/pipelineStore';
import { WorldPresetLibrary } from '../procgen/presets/worldPresetLibrary';
import { RandomizeHistory } from '../procgen/randomize/randomizeHistory';
import { TemplateLibrary } from '../procgen/templates/templateLibrary';
import { isSpriteArt } from '../assets/tiles/spriteArt';
import { TileAssets } from '../assets/tiles/tileAssets';

export interface CheckReporter {
  (name: string, condition: boolean): void;
}

const QUARTER = Math.PI / 2;
const EIGHTH = Math.PI / 4;

export function checkCharacterBillboardInvariants(check: CheckReporter): void {
  checkViewRelativeRotations(check);
  checkAnimationTiming(check);
  checkDefaultCharacterArt(check);
  checkBillboardStorage(check);
  checkHeadingFromMotion(check);
  checkCharacterArtAbilities(check);
}

function checkViewRelativeRotations(check: CheckReporter): void {
  const seen = (heading: number, cameraYaw: number) => viewRelativeRotation(heading, cameraYaw);
  check(
    'a character walking the way the camera looks shows its back, and the other way its front',
    seen(0, 0).rotation === 'back' && seen(Math.PI, 0).rotation === 'front',
  );
  check(
    'a character crossing the view shows its side, mirrored on the far half',
    seen(QUARTER, 0).rotation === 'side' &&
      !seen(QUARTER, 0).mirrored &&
      seen(-QUARTER, 0).rotation === 'side' &&
      seen(-QUARTER, 0).mirrored,
  );
  check(
    'the 45° turns land on the quarter rotations, toward and away',
    seen(EIGHTH, 0).rotation === 'backQuarter' && seen(Math.PI - EIGHTH, 0).rotation === 'frontQuarter',
  );
  check(
    'the eight facings fold onto exactly the five rotations',
    new Set(
      Array.from({ length: 8 }, (_, sector) => seen(sector * EIGHTH, 0).rotation),
    ).size === CHARACTER_ROTATIONS.length,
  );
  check(
    'turning the camera turns every character with it',
    seen(QUARTER, QUARTER).rotation === 'back' && seen(0, QUARTER).rotation === 'side',
  );
  check(
    'a heading a hair either side of dead ahead still reads as facing the viewer',
    seen(Math.PI + 0.2, 0).rotation === 'front' && seen(Math.PI - 0.2, 0).rotation === 'front',
  );
}

function checkAnimationTiming(check: CheckReporter): void {
  check(
    'a frame index cycles with the clock and holds still on a single frame',
    frameIndexAt(4, 8, 0) === 0 &&
      frameIndexAt(4, 8, 0.125) === 1 &&
      frameIndexAt(4, 8, 0.5) === 0 &&
      frameIndexAt(1, 8, 9.9) === 0 &&
      frameIndexAt(4, 0, 9.9) === 0,
  );
  const billboard = humanoidBillboard(WANDERING_TRADER_PALETTE);
  const standing = characterFrame(billboard, { heading: Math.PI, moving: false }, 0, 0)!;
  const walking = characterFrame(billboard, { heading: Math.PI, moving: true }, 0, 0)!;
  check(
    'standing still plays idle and walking plays moving, in the rotation the camera sees',
    standing.animation === 'idle' &&
      walking.animation === 'moving' &&
      standing.rotation === 'front' &&
      walking.rotation === 'front',
  );
  check(
    'the moving animation advances over time',
    JSON.stringify(characterFrame(billboard, { heading: Math.PI, moving: true }, 0, 0.2)!.sprite) !==
      JSON.stringify(walking.sprite),
  );
  const idleOnly = blankCharacterBillboard();
  idleOnly.clips.front.idle = [...framesOf(billboard, 'front', 'idle')];
  const fallback = characterFrame(idleOnly, { heading: 0, moving: true }, 0, 0);
  check(
    'a rotation or animation with no frames falls back to one that has them',
    fallback !== null && fallback.rotation === 'front' && fallback.animation === 'idle',
  );
  check(
    'a billboard with no frames at all draws nothing',
    characterFrame(blankCharacterBillboard(), { heading: 0, moving: false }, 0, 0) === null,
  );
}

function checkDefaultCharacterArt(check: CheckReporter): void {
  const billboard = humanoidBillboard(WANDERING_TRADER_PALETTE);
  check(
    'every rotation ships with both an idle and a moving animation',
    CHARACTER_ROTATIONS.every((rotation) =>
      CHARACTER_ANIMATIONS.every((animation) => framesOf(billboard, rotation, animation).length > 1),
    ),
  );
  check(
    'every shipped frame is valid sprite art with transparent edges',
    CHARACTER_ROTATIONS.every((rotation) =>
      CHARACTER_ANIMATIONS.every((animation) =>
        framesOf(billboard, rotation, animation).every(
          (frame) => isSpriteArt(frame) && frame[0] === null && frame.some((pixel) => pixel !== null),
        ),
      ),
    ),
  );
  check(
    'the five rotations are drawn differently from one another',
    new Set(CHARACTER_ROTATIONS.map((rotation) => JSON.stringify(framesOf(billboard, rotation, 'idle')[0]))).size === 5,
  );
  const creatures = new CreatureAssets();
  const trader = creatures.all().find((creature) => creature.kind === CHARACTER)!;
  check('the default character ships with billboard sprites', trader.billboard !== null);
  check(
    'plain creatures ship without them and keep their cubes',
    creatures.all().filter((creature) => creature.kind !== CHARACTER).every((creature) => creature.billboard === null),
  );
}

function checkBillboardStorage(check: CheckReporter): void {
  const creatures = new CreatureAssets();
  const reloaded = creaturesFromStoredJson(JSON.parse(JSON.stringify(creatures.all())))!;
  const trader = reloaded.find((creature) => creature.kind === CHARACTER)!;
  check(
    'billboards round-trip through storage with every frame and both fps',
    trader.billboard !== null &&
      framesOf(trader.billboard, 'side', 'moving').length === 4 &&
      trader.billboard.movingFps === 8,
  );
  const repaired = sanitizeCharacterBillboard({
    idleFps: 'fast',
    movingFps: 900,
    clips: { front: { idle: [['#ffffff', null, null, '#000000'], 'junk'], moving: 5 }, nope: 1 },
  })!;
  check(
    'stored billboard junk is repaired rather than trusted',
    repaired.idleFps === 3 &&
      repaired.movingFps === 30 &&
      framesOf(repaired, 'front', 'idle').length === 1 &&
      framesOf(repaired, 'front', 'moving').length === 0,
  );
  check(
    'a billboard with nothing usable in it is dropped entirely',
    sanitizeCharacterBillboard({ clips: { front: { idle: ['junk'] } } }) === null &&
      sanitizeCharacterBillboard(null) === null,
  );
  const legacy = creaturesFromStoredJson([
    { id: 0, name: 'old deer', symbol: 'd', color: '#fff', behavior: 0, speed: 1 },
  ])!;
  check('a creature saved before billboards existed loads without one', legacy[0]!.billboard === null);
}

function checkHeadingFromMotion(check: CheckReporter): void {
  check(
    'a heading is the compass angle of the step it came from',
    Math.abs(headingRadians(0, -1)) < 1e-9 &&
      Math.abs(headingRadians(1, 0) - QUARTER) < 1e-9 &&
      Math.abs(headingRadians(0, 1) - Math.PI) < 1e-9,
  );
  const def = new CreatureAssets().all()[0]!;
  const walker = spawnedCreature('test:0,0', def.id, 0, 0);
  walker.targetX = 0;
  walker.targetY = 10;
  moveCreatureTowardTarget(walker, def, () => true, 0.1);
  check(
    'a creature walking south is moving, and faces south',
    walker.moving && Math.abs(walker.heading - Math.PI) < 1e-6,
  );
  const blocked = spawnedCreature('test:1,1', def.id, 0, 0);
  blocked.targetX = 5;
  moveCreatureTowardTarget(blocked, def, () => false, 0.1);
  check('a creature that could not move is not animated as walking', !blocked.moving);
  const arrived = spawnedCreature('test:2,2', def.id, 3, 3);
  moveCreatureTowardTarget(arrived, def, () => true, 0.1);
  check('a creature standing on its target is idle', !arrived.moving);
}

function checkCharacterArtAbilities(check: CheckReporter): void {
  const world = abilityWorld();
  const act = (action: string, params: Record<string, unknown> = {}): AbilityResult =>
    performAbility(world.context, 'god', action, params);
  const plainCreature = world.creatures.all().find((creature) => creature.kind !== CHARACTER)!;
  const sprite = ['#ffffff', null, null, '#000000'];

  check(
    'set_character_frame refuses a rotation that is not one of the five',
    !act('set_character_frame', {
      creature_id: plainCreature.id,
      rotation: 'sideways',
      animation: 'idle',
      frame: 0,
      sprite,
    }).ok,
  );
  check(
    'set_character_frame refuses an animation that is neither idle nor moving',
    !act('set_character_frame', {
      creature_id: plainCreature.id,
      rotation: 'front',
      animation: 'sprinting',
      frame: 0,
      sprite,
    }).ok,
  );
  check(
    'painting the first frame gives a creature a billboard and makes it a character',
    act('set_character_frame', {
      creature_id: plainCreature.id,
      rotation: 'front',
      animation: 'idle',
      frame: 0,
      sprite,
    }).ok &&
      world.creatures.byId(plainCreature.id)!.billboard !== null &&
      world.creatures.byId(plainCreature.id)!.kind === CHARACTER,
  );
  const gap = act('set_character_frame', {
    creature_id: plainCreature.id,
    rotation: 'front',
    animation: 'idle',
    frame: 7,
    sprite,
  });
  check('a frame index past the append slot is refused', !gap.ok && gap.code === 'invalid_value');
  check(
    'the frame after the last one appends',
    act('set_character_frame', {
      creature_id: plainCreature.id,
      rotation: 'front',
      animation: 'idle',
      frame: 1,
      sprite,
    }).ok && framesOf(billboardOf(world, plainCreature.id), 'front', 'idle').length === 2,
  );
  check(
    'set_character_animation_fps clamps to the playable range',
    act('set_character_animation_fps', { creature_id: plainCreature.id, animation: 'moving', fps: 99 }).ok &&
      billboardOf(world, plainCreature.id).movingFps === 30,
  );
  check(
    'remove_character_frame drops one frame and keeps the rest',
    act('remove_character_frame', {
      creature_id: plainCreature.id,
      rotation: 'front',
      animation: 'idle',
      frame: 0,
    }).ok && framesOf(billboardOf(world, plainCreature.id), 'front', 'idle').length === 1,
  );
  check(
    'removing the last frame anywhere takes the whole billboard away',
    act('remove_character_frame', {
      creature_id: plainCreature.id,
      rotation: 'front',
      animation: 'idle',
      frame: 0,
    }).ok && world.creatures.byId(plainCreature.id)!.billboard === null,
  );
  const noArt = act('set_character_animation_fps', {
    creature_id: plainCreature.id,
    animation: 'idle',
    fps: 4,
  });
  check(
    'fps on a character with no sprites says so',
    !noArt.ok && noArt.code === 'no_billboard',
  );
  const character = world.creatures.all().find((creature) => creature.billboard !== null)!;
  check(
    'clear_character_billboard drops every rotation at once',
    act('clear_character_billboard', { creature_id: character.id }).ok &&
      world.creatures.byId(character.id)!.billboard === null,
  );
  check('a billboard cleared to nothing reports no frames', !hasAnyFrame(blankCharacterBillboard()));
}

function billboardOf(world: ReturnType<typeof abilityWorld>, creatureId: number): CharacterBillboard {
  return world.creatures.byId(creatureId)!.billboard!;
}

function abilityWorld() {
  const store = new PipelineStore(emptyPipeline());
  const creatures = new CreatureAssets();
  const context: AbilityContext = {
    store,
    tileAssets: new TileAssets(),
    prefabs: new PrefabAssets(() => -1),
    creatures,
    items: new ItemAssets(),
    templates: new TemplateLibrary([]),
    worldPresets: new WorldPresetLibrary([]),
    randomizeHistory: new RandomizeHistory(),
    groundItems: NO_GROUND_ITEMS,
    puzzles: new PuzzleWorld(store, () => true),
    regionSampler: { tileAt: () => 0, elevationAt: () => 0, voxelColumnAt: () => null },
    actor: {
      pose: () => ({ x: 0, y: 0, facing: 0 }),
      tryStep: () => true,
      turn: () => undefined,
      sightRadiusTiles: () => DEFAULT_CHARACTER_SIGHT_RADIUS_TILES,
      setSightRadiusTiles: () => undefined,
    },
  };
  return { context, creatures };
}

import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { JUMP_CLIMB_LIMIT, climbGateFrom } from '../climbing';
import { EntityRegistry } from '../multiplayer/game/entities';
import { stepPlayerEntity, type PlayerStepWorld } from '../multiplayer/game/playerStep';
import { JUMP_COOLDOWN_TICKS, MOVE_COOLDOWN_TICKS, requestJump } from '../sim/movementOrder';
import { NOTHING_IN_THE_WAY } from '../sim/stepIsAllowed';
import { World } from '../world';

type Ground = (x: number, y: number) => number;

const PIT_AT_ONE: Ground = (x) => (x === 1 ? -4 : 0);

function worldOn(elevationAt: Ground, isWalkableAt: (x: number, y: number) => boolean = () => true) {
  return new World(
    isWalkableAt,
    NOTHING_IN_THE_WAY,
    climbGateFrom(elevationAt),
    climbGateFrom(elevationAt, JUMP_CLIMB_LIMIT),
  );
}

export function checkJumping(check: CheckReporter): void {
  check('walking crosses half a level but no more', (() => {
    const gentle = worldOn((x) => x * 0.5);
    const steep = worldOn((x) => x * 1);
    return gentle.tryStep(1, 0) && gentle.playerX === 1 && !steep.tryStep(1, 0) && steep.playerX === 0;
  })());

  check('a jump climbs onto the ledge that walking refuses', (() => {
    const ledge = worldOn((x) => (x === 0 ? 0 : 1), (x) => x !== 2);
    return !ledge.tryStep(1, 0) && ledge.tryJump(1, 0) && ledge.playerX === 1;
  })());

  check('a jump refuses a rise it cannot reach any more than a step does', (() => {
    const cliff = worldOn((x) => (x === 0 ? 0 : 2));
    return !cliff.tryStep(1, 0) && !cliff.tryJump(1, 0) && cliff.playerX === 0;
  })());

  check('a jump clears a one-tile pit and lands two tiles out', (() => {
    const world = worldOn(PIT_AT_ONE);
    return world.tryJump(1, 0) && world.playerX === 2;
  })());

  check('walking into that same pit drops the walker in it, which is why the jump is worth having', (() => {
    const world = worldOn(PIT_AT_ONE);
    return world.tryStep(1, 0) && world.playerX === 1;
  })());

  check('a jump that overshoots a wall falls back to the tile next to you', (() => {
    const world = worldOn(() => 0, (x) => x !== 2);
    return world.tryJump(1, 0) && world.playerX === 1;
  })());

  check('a jump with nowhere to land at either distance leaves you where you stood', (() => {
    const world = worldOn(() => 0, (x) => x === 0);
    return !world.tryJump(1, 0) && world.playerX === 0;
  })());

  check('a jump may not shove a crate out of its landing tile', (() => {
    const crateAtTwo = new World(
      (x) => x !== 2,
      (x, _y, _dx, _dy, mayPush) => x !== 2 || mayPush,
      climbGateFrom(() => 0),
      climbGateFrom(() => 0, JUMP_CLIMB_LIMIT),
    );
    return crateAtTwo.tryJump(1, 0) && crateAtTwo.playerX === 1;
  })());

  check('the server clears the same pit for an entity that asked to jump', serverJumpClearsThePit());
  check('a jump costs more cooldown than a step', aJumpRestsLongerThanAStep());
  check('a jump asked for straight up spends the rest without moving', anUpwardJumpStaysPut());
}

function stepWorldOn(elevationAt: Ground, isWalkable: (x: number, y: number) => boolean = () => true): PlayerStepWorld {
  return {
    isWalkable,
    stepRules: {
      isWalkableAt: isWalkable,
      clearTheWay: NOTHING_IN_THE_WAY,
      climbGateAt: climbGateFrom(elevationAt),
      jumpGateAt: climbGateFrom(elevationAt, JUMP_CLIMB_LIMIT),
    },
    puzzles: { couldPushInto: () => false, takeKeysAt: () => [] },
  };
}

function spawnedEntity(registry: EntityRegistry) {
  return registry.add('jumper', 'jumper', 'player', 0, 0, 0);
}

function runTicks(world: PlayerStepWorld, registry: EntityRegistry, entity: ReturnType<typeof spawnedEntity>, ticks: number): void {
  for (let tick = 0; tick < ticks; tick++) stepPlayerEntity(world, registry, entity);
}

function serverJumpClearsThePit(): boolean {
  const world = stepWorldOn(PIT_AT_ONE);
  const registry = new EntityRegistry();
  const entity = spawnedEntity(registry);
  requestJump(entity, 2);
  runTicks(world, registry, entity, 1);
  return entity.x === 2 && entity.y === 0;
}

function aJumpRestsLongerThanAStep(): boolean {
  const world = stepWorldOn(() => 0);
  const registry = new EntityRegistry();
  const entity = spawnedEntity(registry);
  requestJump(entity, 2);
  stepPlayerEntity(world, registry, entity);
  return entity.cooldown === JUMP_COOLDOWN_TICKS && JUMP_COOLDOWN_TICKS > MOVE_COOLDOWN_TICKS;
}

function anUpwardJumpStaysPut(): boolean {
  const world = stepWorldOn(() => 0);
  const registry = new EntityRegistry();
  const entity = spawnedEntity(registry);
  requestJump(entity, null);
  stepPlayerEntity(world, registry, entity);
  return entity.x === 0 && entity.y === 0 && entity.cooldown === JUMP_COOLDOWN_TICKS;
}

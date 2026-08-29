import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { JUMP_CLIMB_LIMIT, climbGateFrom } from '../climbing';
import { EntityRegistry } from '../multiplayer/game/entities';
import { stepPlayerEntity, type PlayerStepWorld } from '../multiplayer/game/playerStep';
import { EasedPoint } from '../render/view3d/easedPoint';
import { JUMP_STEER_GRACE_MS, SteeredJump, type JumpTimekeeper } from '../input/steeredJump';
import {
  JUMP_COOLDOWN_TICKS,
  JUMP_MS,
  JUMP_UP,
  MOVE_COOLDOWN_TICKS,
  requestJump,
  type JumpRequest,
} from '../sim/movementOrder';
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
  check('a direction held when space lands steers the jump', aHeldDirectionSteersTheJump());
  check('a direction pressed just after space still steers the jump', aLateDirectionSteersTheJump());
  check('a direction let go just before space still steers the jump', anEarlyDirectionSteersTheJump());
  check('space alone jumps straight up once the steering window passes', spaceAloneJumpsUp());
  check('a jump glides its whole distance over the arc', aJumpGlidesAcrossTheArc());
  check('a direction tapped once steers only the jump that follows it', aTappedDirectionSteersOneJump());
}

class TestClock implements JumpTimekeeper {
  private millis = 0;
  private pending: { at: number; run: () => void } | null = null;

  now(): number {
    return this.millis;
  }

  after(ms: number, run: () => void): () => void {
    this.pending = { at: this.millis + ms, run };
    return () => {
      this.pending = null;
    };
  }

  advance(ms: number): void {
    this.millis += ms;
    const due = this.pending;
    if (due && due.at <= this.millis) {
      this.pending = null;
      due.run();
    }
  }
}

function steeringOnAClock() {
  const clock = new TestClock();
  const launched: JumpRequest[] = [];
  return { clock, launched, jump: new SteeredJump((request) => launched.push(request), clock) };
}

function aHeldDirectionSteersTheJump(): boolean {
  const { launched, jump } = steeringOnAClock();
  jump.hold(2);
  jump.request();
  return launched.length === 1 && launched[0] === 2;
}

function aLateDirectionSteersTheJump(): boolean {
  const { clock, launched, jump } = steeringOnAClock();
  jump.request();
  clock.advance(JUMP_STEER_GRACE_MS / 2);
  jump.hold(4);
  clock.advance(JUMP_STEER_GRACE_MS);
  return launched.length === 1 && launched[0] === 4;
}

function anEarlyDirectionSteersTheJump(): boolean {
  const { clock, launched, jump } = steeringOnAClock();
  jump.hold(6);
  jump.release();
  clock.advance(JUMP_STEER_GRACE_MS / 2);
  jump.request();
  return launched.length === 1 && launched[0] === 6;
}

function spaceAloneJumpsUp(): boolean {
  const { clock, launched, jump } = steeringOnAClock();
  jump.request();
  const waitedQuietly = launched.length === 0;
  clock.advance(JUMP_STEER_GRACE_MS);
  return waitedQuietly && launched.length === 1 && launched[0] === JUMP_UP;
}

function aTappedDirectionSteersOneJump(): boolean {
  const { clock, launched, jump } = steeringOnAClock();
  jump.hold(6);
  jump.release();
  jump.request();
  jump.request();
  clock.advance(JUMP_STEER_GRACE_MS);
  return launched.length === 2 && launched[0] === 6 && launched[1] === JUMP_UP;
}

function aJumpGlidesAcrossTheArc(): boolean {
  const point = new EasedPoint(0, 0);
  const arcSeconds = JUMP_MS / 1000;
  const frames = 12;
  for (let frame = 0; frame < frames; frame++) {
    const dt = arcSeconds / frames;
    point.glideTo(2, 0, dt, arcSeconds - frame * dt);
  }
  const halfway = new EasedPoint(0, 0);
  halfway.glideTo(2, 0, arcSeconds / 2, arcSeconds);
  return Math.abs(point.x - 2) < 1e-6 && Math.abs(halfway.x - 1) < 1e-6;
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

function serverJumpClearsThePit(): boolean {
  const world = stepWorldOn(PIT_AT_ONE);
  const registry = new EntityRegistry();
  const entity = spawnedEntity(registry);
  requestJump(entity, 2);
  stepPlayerEntity(world, registry, entity);
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
  requestJump(entity, JUMP_UP);
  stepPlayerEntity(world, registry, entity);
  return entity.x === 0 && entity.y === 0 && entity.cooldown === JUMP_COOLDOWN_TICKS;
}

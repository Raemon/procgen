import { EntityRegistry, type Entity } from '../game/entities';
import { stepPlayerEntity, type PlayerStepWorld } from '../game/playerStep';
import { holdDirection } from '../../sim/movementOrder';
import { useHereOrAhead } from '../../puzzles/interaction/useAtPose';
import type { UseOutcome } from '../../puzzles/interaction/useFixture';
import { PuzzleState } from '../../puzzles/state/puzzleState';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';

const EAST = 2;

export function checkPuzzleSync(check: CheckReporter): void {
  checkSnapshotRoundTrip(check);
  checkReplaceAllDropsStaleEntries(check);
  checkAClosedGateStopsTheServerStep(check);
  checkWalkingIntoACratePushesItServerSide(check);
  checkKeysAreTakenWhereThePlayerLands(check);
  checkUseFallsBackToTheTileAhead(check);
}

function checkSnapshotRoundTrip(check: CheckReporter): void {
  const state = new PuzzleState();
  state.setOn('room/lever0', true);
  state.moveCrate('room/crate0', { x: 7, y: 9 });
  const twin = new PuzzleState();
  twin.replaceAll(state.snapshot());
  check(
    'a puzzle state snapshot carries levers and crate positions to another state',
    twin.isOn('room/lever0') && twin.crateAt('room/crate0')?.x === 7 && twin.crateAt('room/crate0')?.y === 9,
  );
}

function checkReplaceAllDropsStaleEntries(check: CheckReporter): void {
  const state = new PuzzleState();
  state.setOn('room/leverLocalOnly', true);
  state.moveCrate('room/crateLocalOnly', { x: 1, y: 1 });
  const before = state.revision();
  state.replaceAll({ on: [], crates: [] });
  check(
    'applying a server snapshot forgets local-only solves instead of merging them',
    !state.isOn('room/leverLocalOnly') && state.crateAt('room/crateLocalOnly') === undefined && state.revision() > before,
  );
}

function checkAClosedGateStopsTheServerStep(check: CheckReporter): void {
  const setup = walkingSetup({ gateClosed: true });
  stepPlayerEntity(setup.world, setup.registry, setup.entity);
  check(
    'a closed gate holds the server-side player in place',
    setup.entity.x === 1 && setup.entity.y === 1,
  );
}

function checkWalkingIntoACratePushesItServerSide(check: CheckReporter): void {
  const setup = walkingSetup({ crateAt: { x: 2, y: 1 } });
  stepPlayerEntity(setup.world, setup.registry, setup.entity);
  check(
    'walking into a crate pushes it and takes its tile, as it does offline',
    setup.entity.x === 2 && setup.entity.y === 1 && setup.crate.x === 3 && setup.crate.y === 1,
  );
}

function checkKeysAreTakenWhereThePlayerLands(check: CheckReporter): void {
  const setup = walkingSetup({});
  stepPlayerEntity(setup.world, setup.registry, setup.entity);
  check(
    'the server takes keys on the tile the player steps onto',
    setup.entity.x === 2 && setup.keysTakenAt.some((at) => at.x === 2 && at.y === 1),
  );
}

function checkUseFallsBackToTheTileAhead(check: CheckReporter): void {
  const used: Array<{ x: number; y: number }> = [];
  const nothing: UseOutcome = { ok: false, code: 'nothing_to_use', hint: '' };
  const puzzles = {
    use(x: number, y: number): UseOutcome {
      used.push({ x, y });
      return used.length === 1 ? nothing : { ok: true, summary: 'pulled the lever' };
    },
  };
  const outcome = useHereOrAhead(puzzles, 5, 5, EAST);
  check(
    'use tries underfoot first, then the tile the entity faces',
    outcome.ok && used.length === 2 && used[1]!.x === 6 && used[1]!.y === 5,
  );
}

interface WalkingSetup {
  world: PlayerStepWorld;
  registry: EntityRegistry;
  entity: Entity;
  crate: { x: number; y: number };
  keysTakenAt: Array<{ x: number; y: number }>;
}

function walkingSetup(scene: { gateClosed?: boolean; crateAt?: { x: number; y: number } }): WalkingSetup {
  const registry = new EntityRegistry();
  const entity = registry.add('char', 'walker', 'player', 1, 1, EAST);
  holdDirection(entity, EAST);
  const crate = scene.crateAt ? { ...scene.crateAt } : { x: -99, y: -99 };
  const keysTakenAt: Array<{ x: number; y: number }> = [];
  const gateBlocks = (x: number, y: number) => Boolean(scene.gateClosed) && x === 2 && y === 1;
  const crateBlocks = (x: number, y: number) => x === crate.x && y === crate.y;
  const tileIsWalkable = (x: number, y: number) => y === 1 && x >= 0 && x <= 4;
  const world: PlayerStepWorld = {
    isWalkable: (x, y) => tileIsWalkable(x, y) && !gateBlocks(x, y) && !crateBlocks(x, y),
    stepRules: {
      isWalkableAt: tileIsWalkable,
      clearTheWay: (x, y, dx, dy) => {
        if (gateBlocks(x, y)) return false;
        if (!crateBlocks(x, y)) return true;
        const to = { x: x + dx, y: y + dy };
        if (!tileIsWalkable(to.x, to.y)) return false;
        crate.x = to.x;
        crate.y = to.y;
        return true;
      },
    },
    puzzles: {
      couldPushInto: (x, y, dx, dy) => crateBlocks(x, y) && tileIsWalkable(x + dx, y + dy),
      takeKeysAt: (x, y) => {
        keysTakenAt.push({ x, y });
        return [];
      },
    },
  };
  return { world, registry, entity, crate, keysTakenAt };
}

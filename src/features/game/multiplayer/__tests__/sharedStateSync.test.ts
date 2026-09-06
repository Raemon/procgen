import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { NO_ITEMS } from '@/features/asset-library/items/itemAssets';
import { EntityRegistry, type Entity } from '../game/entities';
import { entityActor } from '../game/entityActor';
import { stepPlayerEntity, type PlayerStepWorld } from '../game/playerStep';
import { holdDirection } from '../../sim/movementOrder';
import { NO_KEYS } from '../../fixtures/keyPurse';
import { useHereOrAhead } from '../../fixtures/useAtPose';
import type { UseOutcome } from '../../fixtures/useOutcome';
import { nodeOfType, storeWithNodes } from '../../__tests__/rulesFixtures';
import { STEP_ALLOWED, registerWorldRules, rulesWithDefaults, stepRefused } from '../../worldRules';
import { WorldRulesSet } from '../../worldRulesSet';

const EAST = 2;
const SCENE_NODE = 'testScene';

interface Scene {
  gateClosed: boolean;
  crate: { x: number; y: number } | null;
  keyAt: { x: number; y: number } | null;
  riseToNext: number;
}

interface SceneShared {
  crate: [number, number] | null;
  gateOpen: boolean;
  keysTaken: number;
}

const scenes = new Map<string, Scene>();

registerWorldRules({
  nodeType: SCENE_NODE,
  attach: ({ node }) => {
    const scene = scenes.get(node.id)!;
    const shared: SceneShared = { crate: scene.crate ? [scene.crate.x, scene.crate.y] : null, gateOpen: !scene.gateClosed, keysTaken: 0 };
    let revision = 0;
    const gateAt = (x: number, y: number) => !shared.gateOpen && x === 2 && y === 1;
    const crateAt = (x: number, y: number) => shared.crate !== null && shared.crate[0] === x && shared.crate[1] === y;
    return rulesWithDefaults({
      nodeId: node.id,
      nodeType: SCENE_NODE,
      owns: () => true,
      initialMine: () => ({ keys: 0 }),
      blocksAt: (x, y) => gateAt(x, y) || crateAt(x, y),
      step: (attempt, mine, defaults) => {
        const { to, dx, dy, mayPush, commit } = attempt;
        if (!defaults.climbGate(attempt.from, to, 0.5)) return stepRefused('too steep');
        if (gateAt(to.x, to.y)) return stepRefused('the gate is shut');
        if (crateAt(to.x, to.y)) {
          const beyond = { x: to.x + dx, y: to.y + dy };
          if (!mayPush || !defaults.tileIsWalkable(beyond.x, beyond.y)) return stepRefused('a crate is in the way');
          if (commit) {
            shared.crate = [beyond.x, beyond.y];
            revision++;
          }
        }
        if (!defaults.tileIsWalkable(to.x, to.y)) return stepRefused('no floor');
        if (commit && scene.keyAt && scene.keyAt.x === to.x && scene.keyAt.y === to.y && shared.keysTaken === 0) {
          shared.keysTaken = 1;
          revision++;
          const held = mine.get(node.id) as { keys: number };
          mine.set(node.id, { keys: held.keys + 1 });
        }
        return STEP_ALLOWED;
      },
      use: (x, y) => {
        if (x !== 2 || y !== 1) return { ok: false, code: 'nothing_to_use', hint: 'nothing here' };
        shared.gateOpen = true;
        revision++;
        return { ok: true, summary: 'opened the gate' };
      },
      revision: () => revision,
      snapshot: () => ({ ...shared, crate: shared.crate ? [...shared.crate] : null }),
      applySnapshot: (raw) => {
        revision++;
        const held = raw as SceneShared | null;
        shared.crate = held?.crate ? [held.crate[0], held.crate[1]] : scene.crate ? [scene.crate.x, scene.crate.y] : null;
        shared.gateOpen = held ? held.gateOpen : !scene.gateClosed;
        shared.keysTaken = held?.keysTaken ?? 0;
      },
    });
  },
});

export function checkSharedStateSync(check: CheckReporter): void {
  checkSnapshotRoundTrip(check);
  checkARebuiltRulesSetKeepsTheSharedState(check);
  checkAClosedGateStopsTheServerStep(check);
  checkATallRiseStopsTheServerStep(check);
  checkWalkingIntoACratePushesItServerSide(check);
  checkKeysLandInTheWalkersOwnSlot(check);
  checkUseFallsBackToTheTileAhead(check);
  checkAVerbOnTheServerChangesWhatEveryoneShares(check);
}

function checkSnapshotRoundTrip(check: CheckReporter): void {
  const setup = walkingSetup({ crate: { x: 2, y: 1 } });
  stepPlayerEntity(setup.world, setup.registry, setup.entity);
  const twin = walkingSetup({ crate: { x: 2, y: 1 } });
  twin.rules.applySnapshot(setup.rules.snapshot());
  check(
    'a shared snapshot carries the crate position to another rules set, keyed by node id',
    twin.rules.blocksAt(3, 1) && !twin.rules.blocksAt(2, 1),
  );
}

function checkARebuiltRulesSetKeepsTheSharedState(check: CheckReporter): void {
  const setup = walkingSetup({ crate: { x: 2, y: 1 } });
  stepPlayerEntity(setup.world, setup.registry, setup.entity);
  const rebuilt = new WorldRulesSet({ tileIsWalkable: setup.tileIsWalkable, elevationAt: () => 0 });
  rebuilt.attach(setup.store, { items: NO_ITEMS, builtValueOf: () => null });
  rebuilt.adoptStateOf(setup.rules);
  check(
    'a rules set rebuilt for a fresh world adopts the crates and doors of the one before it',
    rebuilt.blocksAt(3, 1) && !rebuilt.blocksAt(2, 1),
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

function checkATallRiseStopsTheServerStep(check: CheckReporter): void {
  const setup = walkingSetup({ riseToNext: 2 });
  stepPlayerEntity(setup.world, setup.registry, setup.entity);
  check(
    'a rise over one block holds the server-side player in place without starting a hop',
    setup.entity.x === 1 && setup.entity.y === 1 && setup.entity.cooldown === 0,
  );
}

function checkWalkingIntoACratePushesItServerSide(check: CheckReporter): void {
  const setup = walkingSetup({ crate: { x: 2, y: 1 } });
  stepPlayerEntity(setup.world, setup.registry, setup.entity);
  check(
    'walking into a crate pushes it and takes its tile, as it does offline',
    setup.entity.x === 2 && setup.entity.y === 1 && setup.rules.blocksAt(3, 1),
  );
}

function checkKeysLandInTheWalkersOwnSlot(check: CheckReporter): void {
  const setup = walkingSetup({ keyAt: { x: 2, y: 1 } });
  stepPlayerEntity(setup.world, setup.registry, setup.entity);
  const held = setup.entity.mine.get(SCENE_NODE) as { keys: number } | undefined;
  check(
    'a key taken by the server lands in the slot that overlay keeps for that walker alone',
    setup.entity.x === 2 && held?.keys === 1,
  );
}

function checkUseFallsBackToTheTileAhead(check: CheckReporter): void {
  const used: Array<{ x: number; y: number }> = [];
  const nothing: UseOutcome = { ok: false, code: 'nothing_to_use', hint: '' };
  const fixtures = {
    use(x: number, y: number): UseOutcome {
      used.push({ x, y });
      return used.length === 1 ? nothing : { ok: true, summary: 'pulled the lever' };
    },
  };
  const outcome = useHereOrAhead(fixtures, 5, 5, EAST, { get: () => null, set: () => undefined }, NO_KEYS);
  check(
    'use tries underfoot first, then the tile the entity faces',
    outcome.ok && used.length === 2 && used[1]!.x === 6 && used[1]!.y === 5,
  );
}

function checkAVerbOnTheServerChangesWhatEveryoneShares(check: CheckReporter): void {
  const setup = walkingSetup({ gateClosed: true });
  const before = setup.rules.revision();
  const actor = entityActor(setup.entity, setup.registry, setup.rules);
  const outcome = useHereOrAhead(setup.rules, 1, 1, EAST, actor.mine, NO_KEYS);
  stepPlayerEntity(setup.world, setup.registry, setup.entity);
  check(
    'working the gate ahead through the shared rules opens it for the next step and bumps the revision the loop broadcasts on',
    outcome.ok && setup.entity.x === 2 && setup.rules.revision() > before,
  );
}

interface WalkingSetup {
  world: PlayerStepWorld;
  rules: WorldRulesSet;
  store: ReturnType<typeof storeWithNodes>;
  registry: EntityRegistry;
  entity: Entity;
  tileIsWalkable: (x: number, y: number) => boolean;
}

function walkingSetup(scene: Partial<Scene>): WalkingSetup {
  scenes.set(SCENE_NODE, {
    gateClosed: scene.gateClosed ?? false,
    crate: scene.crate ?? null,
    keyAt: scene.keyAt ?? null,
    riseToNext: scene.riseToNext ?? 0,
  });
  const registry = new EntityRegistry();
  const entity = registry.add('char', 'walker', 'player', 1, 1, EAST);
  holdDirection(entity, EAST);
  const tileIsWalkable = (x: number, y: number) => y === 1 && x >= 0 && x <= 4;
  const store = storeWithNodes(nodeOfType(SCENE_NODE));
  const rules = new WorldRulesSet({
    tileIsWalkable,
    elevationAt: (x) => (x === 2 ? (scene.riseToNext ?? 0) : 0),
  });
  rules.attach(store, { items: NO_ITEMS, builtValueOf: () => null });
  return { world: { rules }, rules, store, registry, entity, tileIsWalkable };
}

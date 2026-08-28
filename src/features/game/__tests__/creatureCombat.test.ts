import { assetId } from '@/features/asset-library/asset';
import { CreatureAssets } from '@/features/asset-library/creatures/creatureAssets';
import { CHASE, IDLE } from '@/features/asset-library/creatures/behaviorKinds';
import { newCreatureWithId } from '@/features/asset-library/creatures/creatureDef';
import { blankInventory } from '@/features/asset-library/items/inventory/inventoryDef';
import { sanitizeSavedWorld } from '@/features/asset-library/worlds/saved/savedWorld';
import type { CreatureSpawn, WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { stubSampler } from '@/features/agents/__tests__/observationTestKit';
import type { CombatEvent } from '../creatureSim/combatEvents';
import { spawnKeyOf } from '../creatureSim/creatureInstance';
import { CreatureSim } from '../creatureSim/creatureSim';
import { SlainCreatureSpawns } from '../creatureSim/slainCreatureSpawns';

const WOLF_ID = assetId<'creatures'>(1);
const FANG_ID = assetId<'items'>(7);
const NORTH = 0 as const;

export function checkCreatureCombat(check: CheckReporter): void {
  checkStrikesLandAndMiss(check);
  checkDeathSticksThroughRespawnScans(check);
  checkSlainLootAndSavedWorldRoundTrip(check);
  checkChasersBiteOnACooldown(check);
}

interface Arena {
  sim: CreatureSim;
  slain: SlainCreatureSpawns;
  events: CombatEvent[];
}

function arenaWith(behavior: number, spawns: CreatureSpawn[], carriesFang = false): Arena {
  const inventory = carriesFang
    ? { ...blankInventory(), placements: [{ itemId: FANG_ID, x: 0, y: 0 }] }
    : null;
  const wolfAssets = new CreatureAssets([
    { ...newCreatureWithId(WOLF_ID), name: 'wolf', behavior, maxHp: 2, attackDamage: 1, inventory },
  ]);
  const slain = new SlainCreatureSpawns();
  const events: CombatEvent[] = [];
  const sim = new CreatureSim({
    sampler: meadowWithSpawns(spawns),
    creatureAssets: wolfAssets,
    world: { actors: () => [{ id: 9, name: 'Ana', x: 0, y: 0 }] },
    isWalkableAt: () => true,
    slain,
    onCombat: (event) => events.push(event),
  });
  sim.step(0);
  return { sim, slain, events };
}

function checkStrikesLandAndMiss(check: CheckReporter): void {
  const den: CreatureSpawn = { x: 0, y: -1, creatureId: WOLF_ID, tag: 'den' };
  const { sim, events } = arenaWith(IDLE, [den]);
  const ana = { id: 9, name: 'Ana', x: 0, y: 0 };

  check('a strike misses when nothing stands within reach', sim.strikeFrom(ana, NORTH, 0.5, 1) === null);

  const hit = sim.strikeFrom(ana, NORTH, 1.5, 1);
  check('a strike within reach lands on the creature ahead', hit?.creatureName === 'wolf' && hit.remainingHp === 1 && !hit.slain);
  check('the hit is reported as an attributed combat event', events.some((event) => event.kind === 'actor_hit_creature' && event.actorName === 'Ana'));

  const facingAway = sim.strikeFrom({ ...ana, y: -3 }, NORTH, 1.5, 1);
  check('a strike ignores a creature standing behind the striker unless point blank', facingAway === null);
}

function checkDeathSticksThroughRespawnScans(check: CheckReporter): void {
  const den: CreatureSpawn = { x: 0, y: -1, creatureId: WOLF_ID, tag: 'den' };
  const { sim, slain } = arenaWith(IDLE, [den]);
  const ana = { id: 9, name: 'Ana', x: 0, y: 0 };

  sim.strikeFrom(ana, NORTH, 1.5, 1);
  const kill = sim.strikeFrom(ana, NORTH, 1.5, 1);
  check('a creature out of hp is slain', kill?.slain === true);
  check('a slain creature leaves the live sim', sim.active().length === 0);
  check('its spawn key is recorded as slain', slain.isSlain(spawnKeyOf('den', 0, -1)));

  sim.step(1);
  check('the slain spawn does not respawn on the next rescan', sim.active().length === 0);
}

function checkSlainLootAndSavedWorldRoundTrip(check: CheckReporter): void {
  const den: CreatureSpawn = { x: 0, y: -1, creatureId: WOLF_ID, tag: 'den' };
  const { sim, slain, events } = arenaWith(IDLE, [den], true);
  const ana = { id: 9, name: 'Ana', x: 0, y: 0 };
  sim.strikeFrom(ana, NORTH, 1.5, 5);

  const death = events.find((event) => event.kind === 'creature_slain');
  check('death drops what the creature carried at its tile', death?.kind === 'creature_slain' && death.droppedItemIds[0] === FANG_ID && death.x === 0 && death.y === -1);

  const saved = sanitizeSavedWorld({
    name: 'after the hunt',
    state: { nodes: [{ id: 'n1', type: 'noiseField', params: {}, inputs: {} }], seed: 1 },
    slainCreatures: slain.snapshot(),
    droppedItems: [{ x: 0, y: -1, itemId: FANG_ID }],
  });
  check('a saved world keeps the slain spawns and dropped loot', saved !== null && saved.slainCreatures[0] === spawnKeyOf('den', 0, -1) && saved.droppedItems[0]?.itemId === FANG_ID);
  check('a saved world without combat history sanitizes to empty lists', sanitizeSavedWorld({ name: 'old', state: { nodes: [{ id: 'n1', type: 'noiseField', params: {}, inputs: {} }], seed: 1 } })?.slainCreatures.length === 0);
}

function checkChasersBiteOnACooldown(check: CheckReporter): void {
  const den: CreatureSpawn = { x: 0, y: -1, creatureId: WOLF_ID, tag: 'den' };
  const { sim, events } = arenaWith(CHASE, [den]);

  sim.step(0.05);
  sim.step(0.05);
  const bites = events.filter((event) => event.kind === 'creature_hit_actor');
  check('a chasing creature in reach bites the nearest actor once per cooldown', bites.length === 1 && bites[0]!.kind === 'creature_hit_actor' && bites[0]!.actorName === 'Ana');

  sim.step(2);
  check('the next bite lands only after the cooldown passes', events.filter((event) => event.kind === 'creature_hit_actor').length === 2);
}

function meadowWithSpawns(spawns: CreatureSpawn[]): WorldSampler {
  return stubSampler(() => 0, undefined, {
    creatureSpawnsIn: (minX, minY, maxX, maxY) =>
      spawns.filter((spawn) => spawn.x >= minX && spawn.x <= maxX && spawn.y >= minY && spawn.y <= maxY),
  });
}

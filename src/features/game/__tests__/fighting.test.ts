import { assetId } from '@/features/asset-library/asset';
import { CHASE } from '@/features/asset-library/creatures/behaviorKinds';
import { CreatureAssets } from '@/features/asset-library/creatures/creatureAssets';
import { newCreatureWithId } from '@/features/asset-library/creatures/creatureDef';
import type { CreatureSpawn, WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import { commandFor } from '@/features/app-shell/runtime/commands/commandCatalog';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { creatureMarkers } from '@/features/agents/creatureMarkers';
import { Fight } from '../combat/fight';
import { creatureStruckBy, STRIKE_REACH_TILES } from '../combat/strikes';
import { spawnKeyOf } from '../creatureSim/creatureInstance';
import { CreatureSim } from '../creatureSim/creatureSim';
import { SECONDS_BETWEEN_BLOWS } from '../creatureSim/creatureStrikes';

const GAUNT_ONE = assetId<'creatures'>(1);
const LAIR: CreatureSpawn = { x: 1, y: 0, creatureId: GAUNT_ONE, tag: 'lair' };
const LAIR_KEY = spawnKeyOf(LAIR.tag, LAIR.x, LAIR.y);
const FACING_EAST = 2 as const;

export function checkFighting(check: CheckReporter): void {
  checkWhoABlowLandsOn(check);
  checkTakingHarm(check);
  checkCreaturesStrikeWhatTheyCatch(check);
  checkACreatureCanBePutDown(check);
  check(
    'striking is one command every view offers, and it says how far it reaches',
    ['god', 'character', 'topdown'].every((mode) => {
      const spec = commandFor(mode as 'god', 'strike');
      return spec !== undefined && spec.description.includes(`${STRIKE_REACH_TILES} tiles`);
    }),
  );
}

function checkWhoABlowLandsOn(check: CheckReporter): void {
  const ahead = { key: 'ahead', x: 1.5, y: 0 };
  const far = { key: 'far', x: STRIKE_REACH_TILES + 1, y: 0 };
  const behind = { key: 'behind', x: -1.8, y: 0 };
  const underfoot = { key: 'underfoot', x: -1, y: 0 };
  const pose = { x: 0, y: 0, facing: FACING_EAST };
  check('a swing lands on the creature ahead of you', creatureStruckBy(pose, [ahead, far])?.key === 'ahead');
  check('a creature beyond arm’s reach takes nothing', creatureStruckBy(pose, [far]) === null);
  check('a creature well behind you takes nothing', creatureStruckBy(pose, [behind]) === null);
  check(
    'one close enough to touch is struck whichever way you face',
    creatureStruckBy(pose, [underfoot])?.key === 'underfoot',
  );
  check(
    'with two in reach the nearer one takes the blow',
    creatureStruckBy(pose, [{ key: 'far-ish', x: 1.9, y: 0 }, { key: 'nearer', x: 1.1, y: 0 }])?.key === 'nearer',
  );
}

function checkTakingHarm(check: CheckReporter): void {
  const fight = new Fight({ vigor: () => 6, strength: () => 2 });
  let downed = 0;
  fight.on('player-downed', () => downed++);
  fight.strikePlayer(2, { x: 0, y: 0 });
  check('a blow takes vigor off the player and leaves the rest', fight.vigorLeft() === 4 && !fight.playerIsDown());
  fight.recover(3);
  check('vigor does not come back while the blows are still falling', fight.vigorLeft() === 4);
  fight.recover(7);
  check('left alone the player mends a point at a time', fight.vigorLeft() === 5);
  fight.strikePlayer(2, { x: 0, y: 0 });
  fight.strikePlayer(3, { x: 0, y: 0 });
  check('enough harm puts the player down, and says so once', fight.playerIsDown() && downed === 1);
  fight.mendPlayer();
  check('waking again restores the whole of the player’s vigor', fight.vigorLeft() === 6);
}

function checkCreaturesStrikeWhatTheyCatch(check: CheckReporter): void {
  const world = { playerX: 0, playerY: 0 };
  const fight = new Fight({ vigor: () => 6, strength: () => 2 });
  const sim = simAround(world, fight);
  sim.step(0.05);
  check('a hunter that has caught you rakes you the moment it does', fight.vigorLeft() === 4);
  sim.step(0.05);
  check('it cannot rake you again in the same breath', fight.vigorLeft() === 4);
  sim.step(SECONDS_BETWEEN_BLOWS);
  check('it comes again once its claws have swung back', fight.vigorLeft() === 2);
  world.playerX = 40;
  world.playerY = 40;
  sim.step(0.05);
  check('walking out of its reach ends the raking', fight.vigorLeft() === 2);
}

function checkACreatureCanBePutDown(check: CheckReporter): void {
  const world = { playerX: 0, playerY: 0 };
  const fight = new Fight({ vigor: () => 20, strength: () => 2 });
  const sim = simAround(world, fight);
  sim.step(0.05);
  const pose = { x: 0, y: 0, facing: FACING_EAST };
  const first = sim.strikeFrom(pose);
  check('a blow that is not enough leaves the creature standing', first?.outcome === 'hurt' && sim.active().length === 1);
  check('and it recoils out of striking range', sim.active()[0]!.recoilFor > 0);
  const second = sim.strikeFrom(pose);
  check('the blow past its vigor puts it down by name', second?.outcome === 'slain' && second.name === 'gaunt one');
  check('a creature that has gone down is gone from the world', sim.active().length === 0);
  sim.step(1);
  check('and it does not walk back out of its lair', sim.active().length === 0 && fight.creatureIsSlain(LAIR_KEY));
  const markers = creatureMarkers(lairSampler(), gauntAssets(), sim).markersIn(-5, -5, 5, 5);
  check('nor is it drawn at the lair it came from', markers.length === 0);
  check('with nothing left in reach a swing finds nobody', sim.strikeFrom(pose) === null);
  sim.forget();
  check('growing the world afresh brings the fallen back', !fight.creatureIsSlain(LAIR_KEY));
}

function simAround(world: { playerX: number; playerY: number }, fight: Fight): CreatureSim {
  return new CreatureSim({
    sampler: lairSampler(),
    creatureAssets: gauntAssets(),
    world,
    isWalkableAt: () => true,
    fight,
  });
}

function gauntAssets(): CreatureAssets {
  return new CreatureAssets([
    {
      ...newCreatureWithId(GAUNT_ONE),
      name: 'gaunt one',
      symbol: 'G',
      behavior: CHASE,
      speed: 2,
      sight: 12,
      vigor: 4,
      strength: 2,
    },
  ]);
}

function lairSampler(): WorldSampler {
  return {
    elevationAt: () => 0,
    creatureSpawnsIn: (minX: number, minY: number, maxX: number, maxY: number) =>
      LAIR.x >= minX && LAIR.x <= maxX && LAIR.y >= minY && LAIR.y <= maxY ? [LAIR] : [],
  } as unknown as WorldSampler;
}

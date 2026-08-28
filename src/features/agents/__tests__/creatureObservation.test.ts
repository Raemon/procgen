import { assetId } from '@/features/asset-library/asset';
import { CreatureAssets } from '@/features/asset-library/creatures/creatureAssets';
import { newCreatureWithId } from '@/features/asset-library/creatures/creatureDef';
import { TileAssets } from '@/features/asset-library/tiles/tileAssets';
import { newTileWithId } from '@/features/asset-library/tiles/tileDef';
import type { CreatureSpawn, WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { spawnedCreature } from '@/features/game/creatureSim/creatureInstance';
import {
  liveCreatureMarkers,
  overlayWithCreatures,
  spawnedCreatureMarkers,
} from '../creatureMarkers';
import { buildObservation, NO_OVERLAY, type AgentObservation } from '../observation';

const MEADOW_TILE = assetId<'tiles'>(0);
const WOLF_ID = assetId<'creatures'>(1);

const meadowTiles = new TileAssets([
  { ...newTileWithId(MEADOW_TILE), name: 'meadow', symbol: '"', walkable: true, height: 1 },
]);

const wolfAssets = new CreatureAssets([
  { ...newCreatureWithId(WOLF_ID), name: 'wolf', symbol: 'w', color: '#cc4444' },
]);

export function checkCreatureObservation(check: CheckReporter): void {
  const facingNorth = { x: 0, y: 0, facing: 0 as const };
  const den: CreatureSpawn = { x: 0, y: -3, creatureId: WOLF_ID, tag: 'den' };
  const sampler = meadowWithSpawns([den]);

  const bare = buildObservation(sampler, meadowTiles, facingNorth, 'god');
  check('without a creature overlay the spawn cell shows only ground', glyphAt(bare, 0, -3) === '"');

  const spawnOverlay = overlayWithCreatures(NO_OVERLAY, spawnedCreatureMarkers(sampler, wolfAssets));
  const observed = buildObservation(sampler, meadowTiles, facingNorth, 'god', undefined, spawnOverlay);
  check('a creature spawn shows its symbol in the observation grid', glyphAt(observed, 0, -3) === 'w');
  check('the legend names the creature after its definition', observed.legend.some((entry) => entry.glyph === 'w' && entry.meaning === 'wolf'));

  const behind = buildObservation(sampler, meadowTiles, facingNorth, 'character', undefined, spawnOverlay);
  check('character mode still withholds creatures standing behind the agent', glyphAt(behind, 0, 3) === ' ');

  const unknownSpawn = meadowWithSpawns([{ x: 2, y: 0, creatureId: assetId<'creatures'>(99), tag: 'ghost' }]);
  const ghostMarkers = spawnedCreatureMarkers(unknownSpawn, wolfAssets).markersIn(-5, -5, 5, 5);
  check('a spawn pointing at a deleted creature stays silent instead of crashing', ghostMarkers.length === 0);

  checkLiveCreatureMarkers(check, den);
}

function checkLiveCreatureMarkers(check: CheckReporter, den: CreatureSpawn): void {
  const sampler = meadowWithSpawns([den]);
  const wanderer = spawnedCreature(`${den.tag}:${den.x},${den.y}`, WOLF_ID, den.x, den.y);
  wanderer.x = 2.4;
  wanderer.y = -1.6;

  const live = liveCreatureMarkers({ active: () => [wanderer] }, sampler, wolfAssets).markersIn(-5, -5, 5, 5);
  check('a simulated creature is marked at its rounded live position', live.some((marker) => marker.x === 2 && marker.y === -2 && marker.glyph === 'w'));
  check('its home spawn is not drawn a second time while it is simulated', !live.some((marker) => marker.x === den.x && marker.y === den.y));

  const dormant = liveCreatureMarkers({ active: () => [] }, sampler, wolfAssets).markersIn(-5, -5, 5, 5);
  check('a spawn the sim has not activated still shows at its den', dormant.some((marker) => marker.x === den.x && marker.y === den.y && marker.tag === 'wolf'));
}

function meadowWithSpawns(spawns: CreatureSpawn[]): WorldSampler {
  return {
    tileAt: () => MEADOW_TILE,
    elevationAt: () => 0,
    markersIn: () => [],
    itemSpawnsIn: () => [],
    creatureSpawnsIn: (minX: number, minY: number, maxX: number, maxY: number) =>
      spawns.filter((spawn) => spawn.x >= minX && spawn.x <= maxX && spawn.y >= minY && spawn.y <= maxY),
  } as unknown as WorldSampler;
}

function glyphAt(observation: AgentObservation, dx: number, dy: number): string {
  const center = Math.floor(observation.viewSize / 2);
  return observation.view[center + dy]![center + dx]!;
}

import '@/features/asset-library/worlds/nodes';
import { emptyPipeline } from '@/features/asset-library/worlds/pipeline/pipelineState';
import { monsterCavesState } from '@/features/asset-library/worlds/__tests__/scriptFixtureState';
import { EMPTY_TILE } from '@/features/asset-library/worlds/values/chunkValues';
import { asciiSnapshot } from '../render/ascii/asciiSnapshot';
import { PLAYER_GLYPH } from '../render/ascii/asciiCells';
import { isWalkableTile } from '../tileWalkability';
import { climbGateFrom } from '../climbing';
import { World } from '../world';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { tileAssets, worldFromState } from '@/features/asset-library/worlds/__tests__/pipelineWorldFixtures';

export function checkAsciiSnapshotAndPlayerFooting(check: CheckReporter): void {
  check('empty void is walkable', isWalkableTile(tileAssets, EMPTY_TILE));

  const caves = worldFromState(monsterCavesState());
  const monsterMarkers = caves.sampler.markersIn(-64, -64, 63, 63);
  check(
    'custom markers keep their own glyph and color',
    monsterMarkers.length > 0 && monsterMarkers.every((m) => m.glyph === 'M' && m.color === '#ff4444'),
  );
  const world = new World((x, y) => isWalkableTile(tileAssets, caves.sampler.tileAt(x, y)));
  world.ensurePlayerOnWalkableGround();
  check(
    'player stands on walkable ground after a world change',
    isWalkableTile(tileAssets, caves.sampler.tileAt(world.playerX, world.playerY)),
  );
  const blockedWorld = new World(() => false);
  check('a refused step leaves the player in place', !blockedWorld.tryStep(1, 0) && blockedWorld.playerX === 0);
  check('a character may step up exactly half a level but no higher', exactStepUpIsTheLimit());
  check('a character may step down more than one block', aLongStepDownIsAllowed());
  check('a fractional rise climbs when both heights round to the same half level', aRoundedHalfLevelRiseIsClimbable());
  check('a small raw rise refuses when its heights round a whole level apart', aRoundedWholeLevelRiseIsRefused());

  const snapshot = asciiSnapshot(caves.sampler, tileAssets, world.playerX, world.playerY, 31, 21);
  const snapshotRows = snapshot.split('\n');
  check('ascii snapshot has the requested dimensions', snapshotRows.length === 21 && snapshotRows[0]!.length === 31);
  check('ascii snapshot marks the player once', snapshot.split(PLAYER_GLYPH).length === 2);

  const emptyWorld = worldFromState(emptyPipeline());
  check('a blank pipeline renders an empty world', emptyWorld.sampler.tileAt(3, 4) === EMPTY_TILE);
}

function exactStepUpIsTheLimit(): boolean {
  const elevationAt = (x: number) => (x === 0 ? 0 : x === 1 ? 0.5 : 3);
  const world = new World(() => true, undefined, climbGateFrom(elevationAt));
  return world.tryStep(1, 0) && !world.tryStep(1, 0) && world.playerX === 1;
}

function aRoundedHalfLevelRiseIsClimbable(): boolean {
  const elevationAt = (x: number) => (x === 0 ? 1.6 : 2.1);
  const world = new World(() => true, undefined, climbGateFrom(elevationAt));
  return world.tryStep(1, 0) && world.playerX === 1;
}

function aRoundedWholeLevelRiseIsRefused(): boolean {
  const elevationAt = (x: number) => (x === 0 ? 1.74 : 2.26);
  const world = new World(() => true, undefined, climbGateFrom(elevationAt));
  return !world.tryStep(1, 0) && world.playerX === 0;
}

function aLongStepDownIsAllowed(): boolean {
  const elevationAt = (x: number) => (x === 0 ? 3 : 0);
  const world = new World(() => true, undefined, climbGateFrom(elevationAt));
  return world.tryStep(1, 0) && world.playerX === 1;
}

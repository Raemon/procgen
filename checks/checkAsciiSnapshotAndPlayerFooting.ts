import '../procgen/nodes';
import { emptyPipeline } from '../procgen/pipeline/pipelineState';
import { sanitizePipeline } from '../procgen/pipeline/sanitizePipeline';
import { examplePipelines } from '../procgen/presets/examplePipelines';
import { EMPTY_TILE } from '../procgen/values/chunkValues';
import { asciiSnapshot } from '../world/render/ascii/asciiSnapshot';
import { PLAYER_GLYPH } from '../world/render/ascii/asciiCells';
import { isWalkableTile } from '../world/tileWalkability';
import { World } from '../world/world';
import type { CheckReporter } from './checkReporter';
import { tileAssets, worldFromState } from './pipelineWorldFixtures';

export function checkAsciiSnapshotAndPlayerFooting(check: CheckReporter): void {
  check('empty void is walkable', isWalkableTile(tileAssets, EMPTY_TILE));

  const caves = worldFromState(sanitizePipeline(examplePipelines()[1]!.state));
  const monsterMarkers = caves.sampler.markersIn(-64, -64, 63, 63);
  check(
    'custom markers keep their own glyph and color',
    monsterMarkers.length > 0 && monsterMarkers.every((m) => m.glyph === 'M' && m.color === '#ff4444'),
  );
  const world = new World((x, y) => isWalkableTile(tileAssets, caves.sampler.tileAt(x, y)));
  world.ensurePlayerHasRoomToMove();
  check(
    'player stands on walkable ground after a world change',
    isWalkableTile(tileAssets, caves.sampler.tileAt(world.playerX, world.playerY)),
  );
  const blockedWorld = new World(() => false);
  check('a refused step leaves the player in place', !blockedWorld.tryStep(1, 0) && blockedWorld.playerX === 0);

  const snapshot = asciiSnapshot(caves.sampler, tileAssets, world.playerX, world.playerY, 31, 21);
  const snapshotRows = snapshot.split('\n');
  check('ascii snapshot has the requested dimensions', snapshotRows.length === 21 && snapshotRows[0]!.length === 31);
  check('ascii snapshot marks the player once', snapshot.split(PLAYER_GLYPH).length === 2);

  const emptyWorld = worldFromState(emptyPipeline());
  check('a blank pipeline renders an empty world', emptyWorld.sampler.tileAt(3, 4) === EMPTY_TILE);
}

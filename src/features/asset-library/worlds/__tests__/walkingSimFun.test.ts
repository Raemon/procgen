import { measureWalkingSimFun, type WalkingSimResult } from '../walkingSim/measureWalkingSimFun';
import { opaqueProbeFrom } from '../walkingSim/sightBlocking';
import { touristLimits } from '../walkingSim/touristWalk';
import {
  cloneCorridorMazeState,
  fixtureTileAssets,
  FOREST_TILE,
  openPlainState,
  samplerOfState,
  variedStructuredState,
  WATER_TILE,
} from './walkingSimFixtures';

const FIXTURE_LIMITS = touristLimits(400, 120);
const FIXTURE_WALK_SEED = 7;

export function checkWalkingSimFun(check: (name: string, condition: boolean) => void): void {
  const plain = measuredFixture(openPlainState());
  const maze = measuredFixture(cloneCorridorMazeState());
  const varied = measuredFixture(variedStructuredState());

  check('every fixture world offers a spawn with room to walk, so no claim below is vacuous', [plain, maze, varied].every((each) => each.measurements.stepsWalked > 100));
  check('a world scores the same on a second walk, so the benchmark can be trusted between runs', sameScore(varied, measuredFixture(variedStructuredState())));
  check('a varied world beats an open plain, since a plain never offers a choice or a new thing to learn', varied.score.overall > plain.score.overall);
  check('a varied world beats a maze of identical corridors, since repetition is not the same as structure', varied.score.overall > maze.score.overall);
  check('an open plain offers no fork whose ways on lead anywhere different', plain.measurements.decisionPointsPer100Steps === 0);
  check('a varied world keeps handing the walker fresh views the whole way, not only at the start', varied.measurements.lessonSpread > plain.measurements.lessonSpread);
  check('regions of a varied world read as places, while a corridor maze looks the same everywhere', varied.measurements.regionalDifferentiation > maze.measurements.regionalDifferentiation);
  check('trees block the eye and shallow water does not, so water gates the feet alone', sightIsBlockedByTreesButNotWater());
}

function measuredFixture(state: ReturnType<typeof openPlainState>): WalkingSimResult {
  const result = measureWalkingSimFun(
    samplerOfState(state),
    fixtureTileAssets,
    FIXTURE_LIMITS,
    FIXTURE_WALK_SEED,
  );
  if (!result) throw new Error('fixture world has nowhere to spawn');
  return result;
}

function sameScore(one: WalkingSimResult, other: WalkingSimResult): boolean {
  return JSON.stringify(one.measurements) === JSON.stringify(other.measurements);
}

function sightIsBlockedByTreesButNotWater(): boolean {
  const isOpaqueAt = opaqueProbeFrom((x) => (x === 0 ? WATER_TILE : FOREST_TILE), fixtureTileAssets);
  return !isOpaqueAt(0, 0) && isOpaqueAt(1, 0);
}

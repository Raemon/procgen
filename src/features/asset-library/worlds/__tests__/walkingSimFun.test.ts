import { visibleCellsFrom } from '../walkingSim/isovist';
import { measureWalkingSimFun, type WalkingSimResult } from '../walkingSim/measureWalkingSimFun';
import { opaqueProbeFrom } from '../walkingSim/sightBlocking';
import { touristLimits } from '../walkingSim/touristWalk';
import { stepProbeFrom } from '../walkingSim/worldProbes';
import {
  cloneCorridorMazeState,
  fixtureTileAssets,
  FOREST_TILE,
  openPlainState,
  populatedVariedState,
  samplerOfState,
  staticNoiseState,
  terracedHighlandState,
  variedStructuredState,
  WATER_TILE,
} from './walkingSimFixtures';

const FIXTURE_LIMITS = touristLimits(400, 120);
const FIXTURE_WALK_SEED = 7;

export function checkWalkingSimFun(check: (name: string, condition: boolean) => void): void {
  const plain = measuredFixture(openPlainState());
  const maze = measuredFixture(cloneCorridorMazeState());
  const staticNoise = measuredFixture(staticNoiseState());
  const varied = measuredFixture(variedStructuredState());
  const populated = measuredFixture(populatedVariedState());

  check('every fixture world offers a spawn with room to walk, so no claim below is vacuous', [plain, maze, staticNoise, varied, populated].every((each) => each.measurements.stepsWalked > 100));
  check('a world scores the same on a second walk, so the benchmark can be trusted between runs', sameScore(varied, measuredFixture(variedStructuredState())));
  check('a varied world beats an open plain, since a plain never offers a choice or a new thing to learn', varied.score.overall > plain.score.overall);
  check('a varied world beats a maze of identical corridors, since repetition is not the same as structure', varied.score.overall > maze.score.overall);
  check('a varied world beats television static, since surprise without learnable structure is only noise', varied.score.overall > staticNoise.score.overall);
  check('the same terrain scores higher once there are discoveries to walk to', populated.score.overall > varied.score.overall);
  check('only a world with discoveries can tear the tourist between a promise and the unseen', populated.measurements.conflictsPer100Steps > varied.measurements.conflictsPer100Steps);
  check('the tourist keeps a solid share of promises, but a wide horizon always shows more than one walk can visit', populated.measurements.promiseKeptShare > 0.3 && populated.measurements.promiseKeptShare < 1);
  check('everything static teaches arrives as ungraspable noise, while a varied world teaches in graspable bites', staticNoise.measurements.graspableLessonShare < varied.measurements.graspableLessonShare);
  check('an open plain offers no fork whose ways on lead anywhere different', plain.measurements.decisionPointsPer100Steps === 0);
  check('a varied world keeps handing the walker fresh views the whole way, not only at the start', varied.measurements.lessonSpread > plain.measurements.lessonSpread);
  check('regions of a varied world read as places, while a corridor maze looks the same everywhere', varied.measurements.regionalDifferentiation > maze.measurements.regionalDifferentiation);
  check('a plain compresses to nothing while a varied world carries a real place grammar', plain.measurements.placeGrammarBits < varied.measurements.placeGrammarBits);
  check('a maze of dead ends makes the tourist retread its own footsteps, while a plain never does', maze.measurements.retreadShare > 0.2 && plain.measurements.retreadShare < 0.05);
  check('a varied world wastes far fewer steps on retreading than a corridor maze', varied.measurements.retreadShare < maze.measurements.retreadShare / 2);
  check('vistas need enclosure first, so a plain that is always open never releases the walker into one', plain.measurements.vistaMomentsPer100Steps === 0 && varied.measurements.vistaMomentsPer100Steps > 0);
  check('every fixture walk keeps revealing across most of its chapters instead of front-loading the journey', [plain, maze, varied, populated].every((each) => each.measurements.revealSpread >= 0.7));
  check('a pooled score carries a spawn consistency factor that only ever discounts, never rewards', [plain, maze, varied, populated].every((each) => spawnConsistencyOf(each) > 0.6 && spawnConsistencyOf(each) <= 1));
  check('trees block the eye and shallow water does not, so water gates the feet alone', sightIsBlockedByTreesButNotWater());
  check('the grader allows a one-block rise, rejects anything higher, and allows the way down', graderUsesTheCharacterStepHeight());

  const terraced = measuredFixture(terracedHighlandState());
  check('cliffs gate uphill travel in a terraced world while a plain never says no', terraced.measurements.elevationGateShare > plain.measurements.elevationGateShare && plain.measurements.elevationGateShare === 0);
  check('climbing a terraced world pays for itself in newly revealed ground', terraced.measurements.climbRevealRatio > 0.2);
  check('cliff edges turn a walk into a chain of route choices no plain can offer', terraced.measurements.decisionPointsPer100Steps > plain.measurements.decisionPointsPer100Steps + 10);
  check('a world with terrain drama beats the same flat meadow', terraced.score.overall > plain.score.overall);
  check('a raised eye sees over a low tree that blinds a walker on the ground', highGroundSeesOverTrees());
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

function spawnConsistencyOf(result: WalkingSimResult): number {
  return result.score.readings.find((each) => each.name === 'spawn consistency')?.value ?? 0;
}

function sightIsBlockedByTreesButNotWater(): boolean {
  const isOpaqueAt = opaqueProbeFrom((x) => (x === 0 ? WATER_TILE : FOREST_TILE), fixtureTileAssets);
  return !isOpaqueAt(0, 0) && isOpaqueAt(1, 0);
}

function highGroundSeesOverTrees(): boolean {
  const treeAtTwo = (x: number) => x === 2;
  const fromGround = visibleCellsFrom({ x: 0, y: 0 }, 6, {
    isOpaqueAt: (x) => treeAtTwo(x),
    elevationAt: () => 0,
  });
  const fromHill = visibleCellsFrom({ x: 0, y: 0 }, 6, {
    isOpaqueAt: (x) => treeAtTwo(x),
    elevationAt: (x) => (x <= 0 ? 4 : 0),
  });
  const seesPastTree = (cells: { x: number; y: number }[]) =>
    cells.some((cell) => cell.x === 5 && cell.y === 0);
  return !seesPastTree(fromGround) && seesPastTree(fromHill);
}

function graderUsesTheCharacterStepHeight(): boolean {
  const elevationAt = (x: number) => (x === 0 ? 0 : x === 1 ? 1 : 2.6);
  const canStep = stepProbeFrom(() => true, elevationAt);
  return canStep(0, 0, 1, 0) && !canStep(1, 0, 2, 0) && canStep(2, 0, 1, 0);
}

import '../nodes';
import type { WorldPoint } from '../values/chunkValues';
import { scriptedContourState, scriptedPointVandalState } from './scriptFixtureState';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { tileBytes, tileIdsInRegion, worldFromState } from './pipelineWorldFixtures';

function checkAScriptCannotCorruptItsInput(check: CheckReporter): void {
  const world = worldFromState(scriptedPointVandalState());
  const planted = pointsOf(world.evaluator.valueFor('seeds', 0, 0)).length;
  world.evaluator.valueFor('vandal', 0, 0);
  const survivors = pointsOf(world.evaluator.valueFor('seeds', 0, 0));
  check('the seed points are there for a script to try to spoil', planted > 0);
  check(
    'a script that empties and rewrites the points it was handed leaves its source untouched',
    survivors.length === planted && survivors.every((point) => point.tag === 'seeds'),
  );
}

function pointsOf(value: unknown): readonly WorldPoint[] {
  return Array.isArray((value as { points?: unknown }).points)
    ? ((value as { points: WorldPoint[] }).points)
    : [];
}

export function checkCustomScriptNodes(check: CheckReporter): void {
  const scriptState = scriptedContourState();
  const scripted = worldFromState(scriptState);
  const scriptedAgain = worldFromState(scriptedContourState());
  check(
    'custom script node runs deterministically',
    tileBytes(scripted.evaluator, 'n2', 1, 1) === tileBytes(scriptedAgain.evaluator, 'n2', 1, 1) &&
      tileIdsInRegion(scripted.sampler, 32).size > 1,
  );
  check('custom script node reports no error on valid code', scripted.evaluator.errorFor('n2') === null);

  checkAScriptCannotCorruptItsInput(check);

  const badScript = scriptedContourState();
  badScript.nodes[1]!.params.code = 'return 5;';
  const broken = worldFromState(badScript);
  broken.evaluator.valueFor('n2', 0, 0);
  check('broken script surfaces an error and yields an empty layer', broken.evaluator.errorFor('n2') !== null);
}

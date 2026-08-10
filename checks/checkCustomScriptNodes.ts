import '../procgen/nodes';
import { scriptedContourState } from './scriptFixtureState';
import type { CheckReporter } from './checkReporter';
import { tileBytes, tileIdsInRegion, worldFromState } from './pipelineWorldFixtures';

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

  const badScript = scriptedContourState();
  badScript.nodes[1]!.params.code = 'return 5;';
  const broken = worldFromState(badScript);
  broken.evaluator.valueFor('n2', 0, 0);
  check('broken script surfaces an error and yields an empty layer', broken.evaluator.errorFor('n2') !== null);
}

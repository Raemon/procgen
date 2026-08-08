import '../procgen/nodes';
import { CHUNK_SIZE } from '../procgen/chunk';
import { computeNodeSignatures } from '../procgen/pipeline/nodeSignatures';
import { asPoints } from '../procgen/values/valueAccess';
import type { CheckReporter } from './checkReporter';
import {
  fieldBytes,
  islandsState,
  tileBytes,
  tileIdsInRegion,
  worldFromState,
} from './pipelineWorldFixtures';

export function checkChunkDeterminismAndSignatures(check: CheckReporter): void {
  const islands = islandsState();
  check('example pipeline survives sanitize with all nodes', islands.nodes.length === 5);

  const a = worldFromState(islandsState());
  const b = worldFromState(islandsState());
  check(
    'same seed generates identical chunks across fresh evaluators',
    fieldBytes(a.evaluator, 'n1', 0, 0) === fieldBytes(b.evaluator, 'n1', 0, 0) &&
      tileBytes(a.evaluator, 'n2', -3, 2) === tileBytes(b.evaluator, 'n2', -3, 2),
  );

  const orderA = worldFromState(islandsState());
  const orderB = worldFromState(islandsState());
  const firstThenFar = [tileBytes(orderA.evaluator, 'n2', 0, 0), tileBytes(orderA.evaluator, 'n2', 5, 7)];
  const farThenFirst = [tileBytes(orderB.evaluator, 'n2', 5, 7), tileBytes(orderB.evaluator, 'n2', 0, 0)];
  check(
    'chunk evaluation order never changes results',
    firstThenFar[0] === farThenFirst[1] && firstThenFar[1] === farThenFirst[0],
  );

  const reseeded = worldFromState(islandsState());
  reseeded.store.setSeed(999);
  check(
    'different seeds generate different worlds',
    fieldBytes(reseeded.evaluator, 'n1', 0, 0) !== fieldBytes(a.evaluator, 'n1', 0, 0),
  );

  const beforeSigs = computeNodeSignatures(islandsState());
  const tweaked = islandsState();
  tweaked.nodes[0]!.params.scale = 0.11;
  const afterSigs = computeNodeSignatures(tweaked);
  check(
    'param change invalidates that node and downstream signatures',
    beforeSigs.get('n1') !== afterSigs.get('n1') && beforeSigs.get('n5') !== afterSigs.get('n5'),
  );
  const downstreamTweak = islandsState();
  downstreamTweak.nodes[1]!.params.threshold = 0.6;
  check(
    'downstream param change leaves upstream signature cached',
    computeNodeSignatures(downstreamTweak).get('n1') === beforeSigs.get('n1'),
  );

  const sampled = worldFromState(islandsState());
  check('elevation binding shapes the world', sampled.sampler.elevationAt(0, 0) !== 0 || sampled.sampler.elevationAt(17, -23) !== 0);
  const treeMarkers = sampled.sampler.markersIn(-64, -64, 63, 63);
  check(
    'scatter markers carry their node id as tag',
    treeMarkers.length > 0 && treeMarkers.every((m) => m.tag === 'n5'),
  );

  sampled.store.setEnabled('n3', false);
  check('disabling a node removes its tile layer', !tileIdsInRegion(sampled.sampler, 48).has(2));
  sampled.store.setEnabled('n3', true);

  const scatterPoints = asPoints(sampled.evaluator.valueFor('n5', 2, -1)) ?? [];
  check(
    'scattered points stay inside their own chunk',
    scatterPoints.every(
      (p) =>
        p.x >= 2 * CHUNK_SIZE && p.x < 3 * CHUNK_SIZE && p.y >= -CHUNK_SIZE && p.y < 0,
    ),
  );
}

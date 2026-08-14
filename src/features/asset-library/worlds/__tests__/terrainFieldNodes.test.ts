import '../nodes';
import type { PipelineState } from '../pipeline/pipelineState';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { fieldAt, stateOfNodes, worldFromState } from './pipelineWorldFixtures';

function terrainNodesState(): PipelineState {
  return stateOfNodes([
    { id: 'plates', type: 'tectonicUplift', params: { plateSize: 256, oceanFraction: 0.6, beltWidth: 64, rangeHeight: 0.34, landHeight: 0.58, basinDepth: 0.34 }, inputs: {} },
    { id: 'rolling', type: 'terrainNoise', params: { scale: 0.02, style: 0, octaves: 5, lacunarity: 2, gain: 0.5 }, inputs: {} },
    { id: 'ridged', type: 'terrainNoise', params: { scale: 0.02, style: 1, octaves: 5, lacunarity: 2, gain: 0.5 }, inputs: {} },
    { id: 'flat', type: 'constantField', params: { value: 0.7 }, inputs: {} },
    { id: 'unwarped', type: 'domainWarp', params: { strength: 0 }, inputs: { source: 'plates', offsetX: 'rolling' } },
    { id: 'warped', type: 'domainWarp', params: { strength: 40 }, inputs: { source: 'plates', offsetX: 'rolling' } },
    { id: 'keepA', type: 'blendFields', params: { weight: 0 }, inputs: { a: 'plates', b: 'rolling' } },
    { id: 'keepB', type: 'blendFields', params: { weight: 1 }, inputs: { a: 'plates', b: 'rolling' } },
    { id: 'flatSlope', type: 'slopeField', params: { radius: 2, gain: 40 }, inputs: { source: 'flat' } },
    { id: 'curved', type: 'hypsometricCurve', params: { seaLevel: 0.5, steepness: 9 }, inputs: { source: 'rolling' } },
    { id: 'terraced', type: 'terraceField', params: { levels: 4, passesAbove: 0.65 }, inputs: { source: 'rolling' } },
    { id: 'terracedWithPasses', type: 'terraceField', params: { levels: 4, passesAbove: 0.55 }, inputs: { source: 'rolling', passes: 'ridged' } },
  ]);
}

export function checkTerrainFieldNodes(check: CheckReporter): void {
  const terrainNodes = worldFromState(terrainNodesState());

  function samplesOf(nodeId: string, span: number, evaluator = terrainNodes.evaluator): number[] {
    const values: number[] = [];
    for (let y = -span; y < span; y += 2) for (let x = -span; x < span; x += 2) values.push(fieldAt(evaluator, nodeId, x, y));
    return values;
  }

  check(
    'every terrain and water field node stays inside 0..1',
    ['plates', 'rolling', 'ridged', 'warped', 'curved'].every((nodeId) =>
      samplesOf(nodeId, 96).every((value) => value >= 0 && value <= 1),
    ),
  );
  check(
    'tectonic uplift produces both ocean basins and mountain belts',
    samplesOf('plates', 400).some((value) => value < 0.35) && samplesOf('plates', 400).some((value) => value > 0.75),
  );
  check(
    'ridged noise reaches higher crests than rolling noise from the same settings',
    Math.max(...samplesOf('ridged', 96)) > Math.max(...samplesOf('rolling', 96)),
  );
  check(
    'domain warp with zero strength is the source field, and with strength it is not',
    samplesOf('unwarped', 48).every((value, i) => Math.abs(value - samplesOf('plates', 48)[i]!) < 1e-6) &&
      samplesOf('warped', 48).some((value, i) => Math.abs(value - samplesOf('plates', 48)[i]!) > 1e-3),
  );
  check(
    'blend fields at weight 0 and 1 are exactly its two inputs',
    samplesOf('keepA', 48).every((value, i) => Math.abs(value - samplesOf('plates', 48)[i]!) < 1e-6) &&
      samplesOf('keepB', 48).every((value, i) => Math.abs(value - samplesOf('rolling', 48)[i]!) < 1e-6),
  );
  check('slope of a constant field is zero everywhere', samplesOf('flatSlope', 48).every((value) => value === 0));

  const curveInput = samplesOf('rolling', 96);
  const curveOutput = samplesOf('curved', 96);
  check(
    'the hypsometric curve keeps sea level fixed and is monotone',
    curveInput.every((value, i) => Math.abs(value - 0.5) > 1e-4 || Math.abs(curveOutput[i]! - 0.5) < 1e-3) &&
      curveInput.every((value, i) => value <= 0.5 === curveOutput[i]! <= 0.5),
  );
  check(
    'the hypsometric curve clears heights away from sea level',
    curveOutput.filter((value) => Math.abs(value - 0.5) < 0.05).length <
      curveInput.filter((value) => Math.abs(value - 0.5) < 0.05).length,
  );

  const quarterSteps = new Set([0, 0.25, 0.5, 0.75, 1]);
  check(
    'a terraced field snaps every cell onto one of its levels',
    samplesOf('terraced', 48).every((value) => quarterSteps.has(value)),
  );
  const passInput = samplesOf('ridged', 48);
  const withPasses = samplesOf('terracedWithPasses', 48);
  const smoothSource = samplesOf('rolling', 48);
  check(
    'where the passes field runs high the source stays smooth, and elsewhere it steps',
    withPasses.every((value, i) =>
      passInput[i]! >= 0.55 ? value === smoothSource[i]! : quarterSteps.has(value),
    ) && withPasses.some((value) => !quarterSteps.has(value)),
  );
}

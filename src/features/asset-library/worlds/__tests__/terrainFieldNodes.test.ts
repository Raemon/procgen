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
    { id: 'places', type: 'regionPlan', params: { pitch: 192, focusShare: 0.3, falloff: 0.6, role: 0 }, inputs: {} },
    { id: 'wilds', type: 'regionPlan', params: { pitch: 192, focusShare: 0.3, falloff: 0.6, role: 1 }, inputs: {} },
    { id: 'bowl', type: 'basinField', params: { centerX: 0, centerY: 0, radius: 128, floor: 0.1 }, inputs: {} },
    { id: 'edge', type: 'contourLine', params: { level: 0.5, width: 1 }, inputs: { source: 'rolling' } },
    { id: 'flatEdge', type: 'contourLine', params: { level: 0.5, width: 1 }, inputs: { source: 'flat' } },
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

  const places = samplesOf('places', 400);
  const wilds = samplesOf('wilds', 400);
  check(
    'a region plan stays inside 0..1 in both its focus and wilderness roles',
    [...places, ...wilds].every((value) => value >= 0 && value <= 1),
  );
  check(
    'a region plan makes a few strong places amid genuine wilderness rather than sameness everywhere',
    places.some((value) => value > 0.7) &&
      places.filter((value) => value === 0).length > places.length / 4,
  );

  const bowlAlongX = [0, 32, 64, 96, 120].map((x) => fieldAt(terrainNodes.evaluator, 'bowl', x, 0));
  check(
    'a basin holds its floor at the center, rises toward the rim, and stays flat at full height beyond it',
    Math.abs(bowlAlongX[0]! - 0.1) < 1e-6 &&
      bowlAlongX.every((value, i) => i === 0 || value > bowlAlongX[i - 1]!) &&
      fieldAt(terrainNodes.evaluator, 'bowl', 200, 0) === 1 &&
      fieldAt(terrainNodes.evaluator, 'bowl', 0, -200) === 1,
  );

  const NEIGHBORS = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const;
  let contourCells = 0;
  let contourAgreesWithSource = true;
  let contourSeen = 0;
  for (let y = -48; y < 48; y++) {
    for (let x = -48; x < 48; x++) {
      const marked = fieldAt(terrainNodes.evaluator, 'edge', x, y);
      contourSeen++;
      if (marked !== 0 && marked !== 1) contourAgreesWithSource = false;
      const below = fieldAt(terrainNodes.evaluator, 'rolling', x, y) < 0.5;
      const touches = NEIGHBORS.some(
        ([dx, dy]) => fieldAt(terrainNodes.evaluator, 'rolling', x + dx, y + dy) >= 0.5,
      );
      if (marked === 1) contourCells++;
      if ((marked === 1) !== (below && touches)) contourAgreesWithSource = false;
    }
  }
  check(
    'a contour line marks exactly the cells below its level that touch a cell at it, including across chunk seams',
    contourAgreesWithSource && contourCells > 0,
  );
  check('a contour line is a thin line rather than a region', contourCells < contourSeen / 5);
  check(
    'a field that never crosses the level has no contour',
    samplesOf('flatEdge', 48).every((value) => value === 0),
  );
}

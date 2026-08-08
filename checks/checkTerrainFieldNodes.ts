import '../procgen/nodes';
import type { PipelineState } from '../procgen/pipeline/pipelineState';
import type { CheckReporter } from './checkReporter';
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
  ]);
}

type TerrainWorld = ReturnType<typeof worldFromState>;

export function checkTerrainFieldNodes(check: CheckReporter): void {
  const terrainNodes = worldFromState(terrainNodesState());
  checkEveryTerrainFieldStaysInsideTheUnitRangeItPromises(check, terrainNodes);
  checkTectonicUpliftRaisesBothOceanBasinsAndMountainBelts(check, terrainNodes);
  checkRidgedNoiseCrestsHigherThanRollingNoise(check, terrainNodes);
  checkDomainWarpMovesTheFieldOnlyWhenGivenStrength(check, terrainNodes);
  checkBlendFieldsAtItsExtremesIsExactlyOneOfItsInputs(check, terrainNodes);
  checkSlopeOfAConstantFieldIsZeroEverywhere(check, terrainNodes);
  checkTheHypsometricCurveHoldsSeaLevelAndClearsTheShallows(check, terrainNodes);
}

function checkEveryTerrainFieldStaysInsideTheUnitRangeItPromises(
  check: CheckReporter,
  terrainNodes: TerrainWorld,
): void {
  check(
    'every terrain and water field node stays inside 0..1',
    ['plates', 'rolling', 'ridged', 'warped', 'curved'].every((nodeId) =>
      samplesOf(terrainNodes, nodeId, 96).every((value) => value >= 0 && value <= 1),
    ),
  );
}

function checkTectonicUpliftRaisesBothOceanBasinsAndMountainBelts(
  check: CheckReporter,
  terrainNodes: TerrainWorld,
): void {
  check(
    'tectonic uplift produces both ocean basins and mountain belts',
    samplesOf(terrainNodes, 'plates', 400).some((value) => value < 0.35) && samplesOf(terrainNodes, 'plates', 400).some((value) => value > 0.75),
  );
}

function checkRidgedNoiseCrestsHigherThanRollingNoise(
  check: CheckReporter,
  terrainNodes: TerrainWorld,
): void {
  check(
    'ridged noise reaches higher crests than rolling noise from the same settings',
    Math.max(...samplesOf(terrainNodes, 'ridged', 96)) > Math.max(...samplesOf(terrainNodes, 'rolling', 96)),
  );
}

function checkDomainWarpMovesTheFieldOnlyWhenGivenStrength(
  check: CheckReporter,
  terrainNodes: TerrainWorld,
): void {
  check(
    'domain warp with zero strength is the source field, and with strength it is not',
    samplesOf(terrainNodes, 'unwarped', 48).every((value, i) => Math.abs(value - samplesOf(terrainNodes, 'plates', 48)[i]!) < 1e-6) &&
      samplesOf(terrainNodes, 'warped', 48).some((value, i) => Math.abs(value - samplesOf(terrainNodes, 'plates', 48)[i]!) > 1e-3),
  );
}

function checkBlendFieldsAtItsExtremesIsExactlyOneOfItsInputs(
  check: CheckReporter,
  terrainNodes: TerrainWorld,
): void {
  check(
    'blend fields at weight 0 and 1 are exactly its two inputs',
    samplesOf(terrainNodes, 'keepA', 48).every((value, i) => Math.abs(value - samplesOf(terrainNodes, 'plates', 48)[i]!) < 1e-6) &&
      samplesOf(terrainNodes, 'keepB', 48).every((value, i) => Math.abs(value - samplesOf(terrainNodes, 'rolling', 48)[i]!) < 1e-6),
  );
}

function checkSlopeOfAConstantFieldIsZeroEverywhere(
  check: CheckReporter,
  terrainNodes: TerrainWorld,
): void {
  check('slope of a constant field is zero everywhere', samplesOf(terrainNodes, 'flatSlope', 48).every((value) => value === 0));
}

function checkTheHypsometricCurveHoldsSeaLevelAndClearsTheShallows(
  check: CheckReporter,
  terrainNodes: TerrainWorld,
): void {
  const curveInput = samplesOf(terrainNodes, 'rolling', 96);
  const curveOutput = samplesOf(terrainNodes, 'curved', 96);
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
}

function samplesOf(terrainNodes: TerrainWorld, nodeId: string, span: number): number[] {
  const values: number[] = [];
  for (let y = -span; y < span; y += 2) for (let x = -span; x < span; x += 2) values.push(fieldAt(terrainNodes.evaluator, nodeId, x, y));
  return values;
}

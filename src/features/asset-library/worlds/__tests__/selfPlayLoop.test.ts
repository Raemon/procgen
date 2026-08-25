import { mulberry32 } from '../random/mulberry32';
import { nodeTypeOf } from '../nodeRegistry';
import { batchScore } from '../selfPlay/batchScore';
import { bredGenome } from '../selfPlay/breedGenomes';
import { diagnosisOf, treatedGenome, type Diagnosis } from '../selfPlay/worldDoctor';
import { readingBandOf } from '../walkingSim/readingBands';
import { worldOfGenome } from '../selfPlay/genomeWorld';
import { mutatedGenome } from '../selfPlay/mutateGenome';
import { SaturationWatch } from '../selfPlay/saturationWatch';
import { scoredGenome, type ScoredWorldSeed } from '../selfPlay/scoreGenome';
import { runTraining, type GenerationRecord } from '../selfPlay/trainingLoop';
import { fingerprintDistance, fingerprintOf } from '../selfPlay/worldFingerprint';
import { genomeAsJson, genomeFromJson, rolledGenome } from '../selfPlay/worldSeedGenome';
import { measureWalkingSimFun } from '../walkingSim/measureWalkingSimFun';
import { touristLimits } from '../walkingSim/touristWalk';
import {
  fixtureTileAssets,
  openPlainState,
  samplerOfState,
  variedStructuredState,
} from './walkingSimFixtures';

const SMOKE_LIMITS = touristLimits(140, 90);
const SMOKE_WALK_SEED = 3;

export function checkSelfPlayLoop(check: (name: string, condition: boolean) => void): void {
  checkGenomesReplayExactly(check);
  checkGenomesBreedTrue(check);
  checkWorldsAreToldApart(check);
  checkTheWorldDoctor(check);
  checkTrainingClimbsAndStops(check);
}

function checkTheWorldDoctor(check: (name: string, condition: boolean) => void): void {
  const patient = scoredGenome(rolledGenome(mulberry32(77)), SMOKE_LIMITS, SMOKE_WALK_SEED);
  if (!patient) throw new Error('doctor fixture world has nowhere to spawn');
  const starving = withReading(patient, 'encounters /100 steps', 0);
  const diagnosis = diagnosisOf(starving);
  check('a world seed that is healthy but for one cratered reading gets that reading as its diagnosis', diagnosis !== null && diagnosis.reading === 'encounters /100 steps' && diagnosis.ailment === 'starved');
  check('a world weak across the board is beyond one treatment, so the doctor declines it', diagnosisOf(withAllReadingsAt(patient, 0.2)) === null);

  const treated = treatedGenome(starving, diagnosis!, mulberry32(9));
  check('treating a discovery-starved world adds or densifies scatter rather than rebuilding it', treated.pipeline.nodes.some((node) => node.type === 'scatterPoints') && treated.pipeline.nodes.length >= starving.genome.pipeline.nodes.length);
  check('treatment is deterministic per stream, so a prescription can be replayed', genomeAsJson(treated) === genomeAsJson(treatedGenome(starving, diagnosis!, mulberry32(9))));

  const flatDiagnosis: Diagnosis = { reading: 'elevation gates', ailment: 'starved' };
  const cured = treatedGenome(withReading(patient, 'elevation gates', 0), flatDiagnosis, mulberry32(11));
  check('a gate-starved world with an elevation display gains cliff terraces with pass corridors', !hasElevationDisplay(patient.genome.pipeline) || cured.pipeline.nodes.some((node) => node.type === 'terraceField'));
}

function withReading(world: ScoredWorldSeed, name: string, value: number): ScoredWorldSeed {
  const band = readingBandOf(name)!;
  const readings = world.score.readings.map((each) =>
    each.name === name
      ? { ...each, value, score: 0.05 }
      : { ...each, score: Math.max(each.score, 0.6) },
  );
  const measurements = { ...world.measurements, [band.key]: value };
  return { ...world, measurements, score: { ...world.score, readings } };
}

function withAllReadingsAt(world: ScoredWorldSeed, score: number): ScoredWorldSeed {
  return {
    ...world,
    score: { ...world.score, readings: world.score.readings.map((each) => ({ ...each, score })) },
  };
}

function hasElevationDisplay(pipeline: ReturnType<typeof rolledGenome>['pipeline']): boolean {
  return pipeline.nodes.some((node) => node.display.mode === 'elevation');
}

function checkGenomesBreedTrue(check: (name: string, condition: boolean) => void): void {
  const one = rolledGenome(mulberry32(21));
  const other = rolledGenome(mulberry32(22));
  const child = bredGenome(one, other, mulberry32(7));
  check('breeding the same parents with the same stream yields the same child, so a cross can be replayed', genomeAsJson(child) === genomeAsJson(bredGenome(one, other, mulberry32(7))));
  check('a bred child inherits its palette genes whole from one parent rather than a broken mixture', [one, other].some((parent) => parent.kitSeed === child.kitSeed && parent.accentKitSeed === child.accentKitSeed));
  check('a bred child carries nodes and survives its own sanitize, so a cross is always a legal world', child.pipeline.nodes.length > 0 && genomeAsJson(genomeFromJson(JSON.parse(genomeAsJson(child)))) === genomeAsJson(child));
  check('a bred child splices ground from both parents rather than cloning one of them', genomeAsJson(child) !== genomeAsJson(one) && genomeAsJson(child) !== genomeAsJson(other));
  check('rolled genomes sometimes settle their worlds with village streets and plots', someRolledGenomeFoundsAVillage());
}

function someRolledGenomeFoundsAVillage(): boolean {
  return Array.from({ length: 30 }, (_each, at) => rolledGenome(mulberry32(300 + at))).some(
    (genome) =>
      genome.pipeline.nodes.some((node) => node.type === 'villagePlots') &&
      genome.pipeline.nodes.some((node) => node.type === 'villageStreets'),
  );
}

function checkGenomesReplayExactly(check: (name: string, condition: boolean) => void): void {
  const genome = rolledGenome(mulberry32(99));
  const replayed = rolledGenome(mulberry32(99));
  check('a genome rolled from a seed comes out identical every time, so a candidate can be replayed', genomeAsJson(genome) === genomeAsJson(replayed));
  check('a genome survives the round trip through its own json, so elites can be stored and reopened', genomeAsJson(genomeFromJson(JSON.parse(genomeAsJson(genome)))) === genomeAsJson(genome));
  check('the same genome samples the same ground twice, so scoring it is repeatable', sameGroundTwice(genome));
  check('a mutated genome still names node types the registry knows', everyNodeTypeIsRegistered(mutatedGenome(genome, mulberry32(5))));
}

function checkWorldsAreToldApart(check: (name: string, condition: boolean) => void): void {
  const plain = fingerprintOfState(openPlainState());
  const varied = fingerprintOfState(variedStructuredState());
  check('a world is exactly as far from itself as no distance at all', fingerprintDistance(varied, varied) === 0);
  check('an open plain and a varied world are told apart by their fingerprints', fingerprintDistance(plain, varied) > 0.2);

  const twins = twinBatchOf(1234);
  check('a batch of one world seed twice reads as no diversity at all, and names the duplicate pair', twins.diversity === 0 && twins.nearDuplicatePairs === 1);
  check('duplicated worlds drag the batch score below their own fun, so sameness costs something', twins.overall < twins.meanFun);
}

function checkTrainingClimbsAndStops(check: (name: string, condition: boolean) => void): void {
  const trajectory: GenerationRecord[] = [];
  const run = runTraining(
    { generations: 3, batchSize: 3, stepBudget: 120, radiusCap: 80, seed: 4242, patience: 9 },
    (record) => trajectory.push(record),
  );
  check('a smoke run walks every generation it was asked for', trajectory.length === 3);
  check('the archive only ever gets better, since an elite is replaced only by a better world seed', neverFallsBack(trajectory.map((each) => each.archiveBestFun)));
  check('archive coverage only ever grows, since a filled cell is never emptied', neverFallsBack(trajectory.map((each) => each.coverage)));
  check('a smoke run finds at least one world worth keeping', run.archive.all().length > 0);
  check('a run that stops improving is called saturated rather than left to spin', watchThatSawNoGains().hasSaturated());
  check('a run that keeps improving is never called saturated', !watchThatKeptGaining().hasSaturated());
}

function sameGroundTwice(genome: ReturnType<typeof rolledGenome>): boolean {
  const one = worldOfGenome(genome).sampler;
  const other = worldOfGenome(genome).sampler;
  return groundLineOf(one) === groundLineOf(other);
}

function groundLineOf(sampler: { tileAt: (x: number, y: number) => number }): string {
  return Array.from({ length: 40 }, (_each, at) => sampler.tileAt(at - 20, at % 7)).join(',');
}

function everyNodeTypeIsRegistered(genome: ReturnType<typeof rolledGenome>): boolean {
  return genome.pipeline.nodes.every((node) => nodeTypeOf(node.type) !== undefined);
}

function fingerprintOfState(state: ReturnType<typeof openPlainState>) {
  const walked = measureWalkingSimFun(
    samplerOfState(state),
    fixtureTileAssets,
    SMOKE_LIMITS,
    SMOKE_WALK_SEED,
  );
  if (!walked) throw new Error('fixture world has nowhere to spawn');
  return fingerprintOf(walked.measurements, walked.seenCharacterShares);
}

function twinBatchOf(seed: number) {
  const genome = rolledGenome(mulberry32(seed));
  const scored = scoredGenome(genome, SMOKE_LIMITS, SMOKE_WALK_SEED);
  const twins = [scored, scoredGenome(genome, SMOKE_LIMITS, SMOKE_WALK_SEED)].filter(
    (world): world is ScoredWorldSeed => world !== null,
  );
  return batchScore(twins);
}

function neverFallsBack(values: readonly number[]): boolean {
  return values.every((value, at) => at === 0 || value >= values[at - 1]!);
}

function watchThatSawNoGains(): SaturationWatch {
  const watch = new SaturationWatch(3);
  for (let generation = 0; generation < 4; generation++) watch.notice(0.5, 0.25);
  return watch;
}

function watchThatKeptGaining(): SaturationWatch {
  const watch = new SaturationWatch(3);
  for (let generation = 0; generation < 4; generation++) watch.notice(0.5 + generation * 0.05, 0.25);
  return watch;
}

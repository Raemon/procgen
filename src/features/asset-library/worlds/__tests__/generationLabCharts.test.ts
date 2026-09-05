import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import {
  clockText,
  elapsedMsOf,
  etaSecondsOf,
  msPerStepOf,
  progressShare,
} from '../gen/labProgress';
import {
  barHeightOf,
  CHART_FRAME,
  indexAtX,
  patienceShare,
  plotHeight,
  plotWidth,
  sharePath,
  trajectoryPointsOf,
  xOfIndex,
  yOfShare,
} from '../gen/trajectoryScales';
import {
  candidatePlace,
  lastCandidateLine,
  paceLine,
  phaseLine,
  stalenessLine,
  type LabPhaseRun,
} from '../gen/labPhase';
import { refusalText } from '../gen/labClient';
import type { CandidateRecord } from '../selfPlay/candidateRecord';
import type { GenerationRecord } from '../selfPlay/trainingRunner';

export function checkGenerationLabCharts(check: CheckReporter): void {
  checkTheChartFillsItsFrame(check);
  checkHoverFindsTheGenerationUnderThePointer(check);
  checkBarsAndPatienceStayInsideTheirBand(check);
  checkTheRunClockAndEta(check);
  checkTheRunSaysWhatItIsDoing(check);
  checkASilentServerAndARefusalAreBothVisible(check);
}

function checkTheChartFillsItsFrame(check: CheckReporter): void {
  check('the plot spans the frame minus its padding, so nothing is drawn under the axis labels', plotWidth(CHART_FRAME) === CHART_FRAME.width - CHART_FRAME.padLeft - CHART_FRAME.padRight && plotHeight(CHART_FRAME) === CHART_FRAME.height - CHART_FRAME.padTop - CHART_FRAME.padBottom);
  check('the first generation sits on the left edge and the last on the right', xOfIndex(CHART_FRAME, 5, 0) === CHART_FRAME.padLeft && xOfIndex(CHART_FRAME, 5, 4) === CHART_FRAME.padLeft + plotWidth(CHART_FRAME));
  check('a lone generation is drawn in the middle rather than divided by zero', xOfIndex(CHART_FRAME, 1, 0) === CHART_FRAME.padLeft + plotWidth(CHART_FRAME) / 2);
  check('a fun of one reaches the top of the plot and a fun of zero its floor', yOfShare(CHART_FRAME, 1) === CHART_FRAME.padTop && yOfShare(CHART_FRAME, 0) === CHART_FRAME.padTop + plotHeight(CHART_FRAME));
  check('a value outside zero to one is held at the edge instead of drawn off the chart', yOfShare(CHART_FRAME, 4) === yOfShare(CHART_FRAME, 1) && yOfShare(CHART_FRAME, -2) === yOfShare(CHART_FRAME, 0));

  const path = sharePath(CHART_FRAME, [0.1, 0.5, 0.9]);
  check('a series is drawn as one move followed by a line per later generation', path.startsWith('M ') && path.split('L').length === 3);

  const points = trajectoryPointsOf([generationRecord(1, 0.4), generationRecord(2, 0.6)]);
  check('a trajectory point carries the three fun series and coverage the chart draws', points.length === 2 && points[1]!.archiveBestFun === 0.6 && points[1]!.batchMeanFun === 0.3 && points[1]!.coverage === 0.25);
}

function checkHoverFindsTheGenerationUnderThePointer(check: CheckReporter): void {
  check('the pointer over the left edge names the first generation', indexAtX(CHART_FRAME, 4, CHART_FRAME.padLeft) === 0);
  check('the pointer over the right edge names the last generation', indexAtX(CHART_FRAME, 4, CHART_FRAME.padLeft + plotWidth(CHART_FRAME)) === 3);
  check('the pointer between two generations snaps to the nearer one', indexAtX(CHART_FRAME, 4, xOfIndex(CHART_FRAME, 4, 2) + 4) === 2);
  check('the pointer beyond the plot is held to a generation that exists', indexAtX(CHART_FRAME, 4, -500) === 0 && indexAtX(CHART_FRAME, 4, 5000) === 3);
  check('a chart with no generation names none', indexAtX(CHART_FRAME, 0, 40) === -1);
}

function checkBarsAndPatienceStayInsideTheirBand(check: CheckReporter): void {
  check('the busiest generation fills the admission band and an empty one draws nothing', barHeightOf(4, 4, 20) === 20 && barHeightOf(0, 4, 20) === 0);
  check('half the admissions of the busiest generation draw half the bar', barHeightOf(2, 4, 20) === 10);
  check('a generation that admitted nothing anywhere leaves the band empty rather than dividing by zero', barHeightOf(0, 0, 20) === 0);
  check('the patience meter fills as generations pass without a gain and stops when full', patienceShare(0, 12) === 0 && patienceShare(6, 12) === 0.5 && patienceShare(20, 12) === 1);
}

function checkTheRunClockAndEta(check: CheckReporter): void {
  const startedAt = '2026-08-21T10:00:00.000Z';
  const now = Date.parse('2026-08-21T10:00:30.000Z');
  check('a running run is timed up to now', elapsedMsOf(startedAt, null, now) === 30_000);
  check('a finished run is timed to when it finished, so its clock stops', elapsedMsOf(startedAt, '2026-08-21T10:00:10.000Z', now) === 10_000);
  check('the pace is the time each candidate took so far', msPerStepOf(10, 30_000) === 3000);
  check('nothing done yet means no pace to report', msPerStepOf(0, 30_000) === null);
  check('the estimate is the pace times the candidates still to come', etaSecondsOf(10, 20, 30_000) === 30);
  check('a run with nothing left to do reports no estimate', etaSecondsOf(20, 20, 30_000) === null);
  check('a clock under a minute reads in seconds and a longer one in minutes', clockText(45) === '45s' && clockText(64) === '1m 04s');
  check('progress is a share between none and all of it', progressShare(0, 8) === 0 && progressShare(4, 8) === 0.5 && progressShare(9, 8) === 1 && progressShare(1, 0) === 0);
}

function checkTheRunSaysWhatItIsDoing(check: CheckReporter): void {
  const fresh = phaseRun([]);
  check('a run with no generation yet is already walking the first candidate of the first generation', candidatePlace(fresh) === 'candidate 1 of 4 in generation 1 of 3');

  const partway = phaseRun([withCandidates(generationRecord(1, 0.4), 2)]);
  check('a half-filled generation names the candidate being walked right now', candidatePlace(partway) === 'candidate 3 of 4 in generation 1 of 3');

  const filled = phaseRun([withCandidates(generationRecord(1, 0.4), 4)]);
  check('a full generation does not count a fifth candidate that the batch has no room for', candidatePlace(filled) === 'candidate 4 of 4 in generation 1 of 3');

  check('a running run says it is walking a whole world per candidate', phaseLine(partway).startsWith('walking candidate 3 of 4'));
  check('a failed run leads with why it failed instead of its position', phaseLine({ ...partway, status: 'failed', error: 'the sampler gave up' }) === 'the run failed: the sampler gave up');
  check('a stopped run says how far it got', phaseLine({ ...partway, status: 'stopped' }) === 'stopped after 2 candidates');
  check('a finished run says it graded everything', phaseLine({ ...partway, status: 'done' }) === 'finished all 2 candidates it graded');

  check('the last candidate graded is named with its origin and its score', lastCandidateLine(partway.generations) === 'last graded: candidate 2 (mutated) fun 0.500, admitted');
  check('a candidate with nowhere to walk says so instead of showing a score', lastCandidateLine([withCandidates(generationRecord(1, 0.4), 1, false)]) === 'last graded: candidate 1 (mutated) had nowhere to walk');
  check('a run that has graded nothing has no last candidate to name', lastCandidateLine([]) === null);

  check('the pace is spelled out per candidate once one has finished', paceLine(4, 12_000) === 'about 3s per candidate');
  check('a run that has finished no candidate reports no pace yet', paceLine(0, 12_000) === null);
}

function checkASilentServerAndARefusalAreBothVisible(check: CheckReporter): void {
  const now = Date.parse('2026-08-21T10:00:10.000Z');
  check('a poll answered a moment ago is not called out as slow', stalenessLine(now - 500, now - 400, now) === null);
  check('a poll the server has left hanging says how long it has been waiting', stalenessLine(now - 9000, now - 6000, now) === 'the server has been busy for 6s — last answer 9s ago');
  check('a first poll that has never been answered says so rather than showing a made-up age', stalenessLine(null, now - 6000, now) === 'the server has been busy for 6s — nothing back yet');
  check('a poll that is not in flight is never called slow', stalenessLine(now - 9000, null, now) === null);

  check('a refusal is read out of the api failure body so the page can show the hint', refusalText(409, JSON.stringify({ error: 'nothing_to_install', hint: 'lab_2 holds no world seed' })) === '409 nothing_to_install — lab_2 holds no world seed');
  check('a body that is not our failure json is still shown rather than swallowed', refusalText(502, '<html>bad gateway</html>') === '502 — <html>bad gateway</html>');
  check('an empty body still names the status the server answered with', refusalText(500, '') === '500 — the server said nothing');
}

function phaseRun(generations: GenerationRecord[]): LabPhaseRun {
  return {
    status: 'running',
    progress: { done: generations.reduce((sum, each) => sum + each.candidates.length, 0), total: 12 },
    settings: { generations: 3, batch_size: 4 },
    generations,
    error: null,
  };
}

function withCandidates(record: GenerationRecord, count: number, walkable = true): GenerationRecord {
  return { ...record, candidates: Array.from({ length: count }, (_at, at) => candidateRecord(at + 1, walkable)) };
}

function candidateRecord(at: number, walkable: boolean): CandidateRecord {
  return {
    name: `candidate ${at}`,
    origin: 'mutated',
    parents: [],
    fun: walkable ? 0.5 : null,
    admitted: walkable,
    walkable,
    weakest: [],
  };
}

function generationRecord(generation: number, best: number): GenerationRecord {
  return {
    generation,
    batch: { meanFun: best / 2, bestFun: best, diversity: 0.1, nearDuplicatePairs: 0, overall: 0.2 },
    archiveBestFun: best,
    coverage: generation / 8,
    admissions: generation,
    patientsTreated: 0,
    worldSeedsWithNowhereToWalk: 0,
    generationsSinceGain: 0,
    candidates: [],
  };
}

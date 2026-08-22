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
import type { GenerationRecord } from '../selfPlay/trainingRunner';

export function checkGenerationLabCharts(check: CheckReporter): void {
  checkTheChartFillsItsFrame(check);
  checkHoverFindsTheGenerationUnderThePointer(check);
  checkBarsAndPatienceStayInsideTheirBand(check);
  checkTheRunClockAndEta(check);
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

function generationRecord(generation: number, best: number): GenerationRecord {
  return {
    generation,
    batch: { meanFun: best / 2, bestFun: best, diversity: 0.1, nearDuplicatePairs: 0, overall: 0.2 },
    archiveBestFun: best,
    coverage: generation / 8,
    admissions: generation,
    patientsTreated: 0,
    worldsWithNowhereToWalk: 0,
    generationsSinceGain: 0,
    candidates: [],
  };
}

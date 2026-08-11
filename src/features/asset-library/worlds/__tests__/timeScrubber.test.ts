import {
  SCRUB_STEPS,
  scrubStepOfTime,
  timeOfScrubStep,
} from '../time/scrubberScale';
import { DEEPEST_PAST, PRESENT, clampTime } from '../time/worldTime';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';

export function checkTimeScrubber(check: CheckReporter): void {
  check(
    'the scrubber ends at the present and begins at the deepest past the world knows',
    timeOfScrubStep(SCRUB_STEPS) === PRESENT && timeOfScrubStep(0) === DEEPEST_PAST,
  );
  check(
    'dragging the scrubber only ever moves time one way, so the slider never doubles back',
    everyStepIsWeaklyEarlierGoingLeft(),
  );
  check(
    'a time the scrubber set redraws the slider at a step meaning that same time',
    everySampledStepRoundTrips(),
  );
  check(
    'the near half of the scrubber covers the settled centuries, not the volcanic aeons',
    timeOfScrubStep(SCRUB_STEPS / 2) > -100_000,
  );
  check(
    'every step lands on a time the world would accept unchanged',
    everySampledStep((step) => clampTime(timeOfScrubStep(step)) === timeOfScrubStep(step)),
  );
}

function everyStepIsWeaklyEarlierGoingLeft(): boolean {
  for (let step = 1; step <= SCRUB_STEPS; step++) {
    if (timeOfScrubStep(step) < timeOfScrubStep(step - 1)) return false;
  }
  return true;
}

function everySampledStepRoundTrips(): boolean {
  return everySampledStep((step) => {
    const time = timeOfScrubStep(step);
    return timeOfScrubStep(scrubStepOfTime(time)) === time;
  });
}

function everySampledStep(holds: (step: number) => boolean): boolean {
  for (let step = 0; step <= SCRUB_STEPS; step += 7) if (!holds(step)) return false;
  return holds(SCRUB_STEPS);
}

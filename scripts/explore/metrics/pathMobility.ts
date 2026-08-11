import { stepsTaken, type ExplorationTrace } from '../explorationTrace';

export function uniqueVisitedPerStep(trace: ExplorationTrace): number {
  const steps = stepsTaken(trace);
  return steps === 0 ? 0 : trace.visited.size / steps;
}

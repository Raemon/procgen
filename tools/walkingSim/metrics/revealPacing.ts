import { meanOf } from './meanOf';

export interface RevealPacing {
  meanRevealPerStep: number;
  longestDroughtRatio: number;
}

export function revealPacing(revealPerStep: number[]): RevealPacing {
  return {
    meanRevealPerStep: meanOf(revealPerStep),
    longestDroughtRatio: droughtShareOfWalk(revealPerStep),
  };
}

function droughtShareOfWalk(revealPerStep: number[]): number {
  if (revealPerStep.length === 0) return 0;
  return longestRunOfNothingNew(revealPerStep) / revealPerStep.length;
}

function longestRunOfNothingNew(revealPerStep: number[]): number {
  let longest = 0;
  let running = 0;
  for (const revealed of revealPerStep) {
    running = revealed === 0 ? running + 1 : 0;
    longest = Math.max(longest, running);
  }
  return longest;
}

import { meanOf, shareOf } from './meanOf';

export function mysteryEdgeShare(
  mysteryEdgesPerStep: readonly number[],
  isovistAreaPerStep: readonly number[],
): number {
  return shareOf(meanOf(mysteryEdgesPerStep), meanOf(isovistAreaPerStep));
}

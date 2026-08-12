import {
  MOST_VITALITY_CARRIED,
  STARTING_VITALITY,
  VITALITY_TOKEN,
  type TokenAmount,
} from './transitionRule';

export interface TokenCount {
  tokenType: number;
  count: number;
}

export class TokenPurse {
  private readonly held = new Map<number, number>();

  constructor(private readonly startingVitality: number = STARTING_VITALITY) {
    this.refillToStart();
  }

  refillToStart(): void {
    this.held.clear();
    this.held.set(VITALITY_TOKEN, this.startingVitality);
  }

  count(tokenType: number): number {
    return this.held.get(tokenType) ?? 0;
  }

  vitality(): number {
    return this.count(VITALITY_TOKEN);
  }

  shortfalls(asked: readonly TokenAmount[]): TokenAmount[] {
    return asked
      .map((each) => ({ tokenType: each.tokenType, amount: each.amount - this.count(each.tokenType) }))
      .filter((each) => each.amount > 0);
  }

  spend(amounts: readonly TokenAmount[]): void {
    for (const each of amounts) this.set(each.tokenType, this.count(each.tokenType) - each.amount);
  }

  gain(amounts: readonly TokenAmount[]): void {
    for (const each of amounts) this.set(each.tokenType, this.count(each.tokenType) + each.amount);
  }

  counts(): TokenCount[] {
    return [...this.held.entries()]
      .filter(([, count]) => count !== 0)
      .sort((a, b) => a[0] - b[0])
      .map(([tokenType, count]) => ({ tokenType, count }));
  }

  private set(tokenType: number, count: number): void {
    this.held.set(tokenType, cappedCount(tokenType, count));
  }
}

function cappedCount(tokenType: number, count: number): number {
  const ceiling = tokenType === VITALITY_TOKEN ? MOST_VITALITY_CARRIED : Number.MAX_SAFE_INTEGER;
  return Math.max(0, Math.min(ceiling, count));
}

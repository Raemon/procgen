const WORTHWHILE_GAIN = 0.002;

export class SaturationWatch {
  private bestSoFar = 0;
  private coverageSoFar = 0;
  private generationsWithoutGain = 0;

  constructor(private readonly patience: number) {}

  notice(bestFun: number, coverage: number): void {
    if (this.isAGain(bestFun, coverage)) this.generationsWithoutGain = 0;
    else this.generationsWithoutGain++;
    this.bestSoFar = Math.max(this.bestSoFar, bestFun);
    this.coverageSoFar = Math.max(this.coverageSoFar, coverage);
  }

  hasSaturated(): boolean {
    return this.generationsWithoutGain >= this.patience;
  }

  generationsSinceGain(): number {
    return this.generationsWithoutGain;
  }

  private isAGain(bestFun: number, coverage: number): boolean {
    return bestFun > this.bestSoFar + WORTHWHILE_GAIN || coverage > this.coverageSoFar;
  }
}

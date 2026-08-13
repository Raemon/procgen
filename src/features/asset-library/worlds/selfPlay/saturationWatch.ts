const WORTHWHILE_GAIN = 0.002;

export class SaturationWatch {
  private bestSoFar = 0;
  private meanSoFar = 0;
  private generationsWithoutGain = 0;

  constructor(private readonly patience: number) {}

  notice(bestFun: number, meanEliteFun: number): void {
    if (this.isAGain(bestFun, meanEliteFun)) this.generationsWithoutGain = 0;
    else this.generationsWithoutGain++;
    this.bestSoFar = Math.max(this.bestSoFar, bestFun);
    this.meanSoFar = Math.max(this.meanSoFar, meanEliteFun);
  }

  hasSaturated(): boolean {
    return this.generationsWithoutGain >= this.patience;
  }

  generationsSinceGain(): number {
    return this.generationsWithoutGain;
  }

  private isAGain(bestFun: number, meanEliteFun: number): boolean {
    return (
      bestFun > this.bestSoFar + WORTHWHILE_GAIN || meanEliteFun > this.meanSoFar + WORTHWHILE_GAIN
    );
  }
}

export interface WorldMeasurements {
  uniqueCells: number;
  regionExhausted: boolean;
  mobility: number;
  deadEndRatio: number;
  encountersPer100Cells: number;
  tileEntropyBits: number;
  noveltyCount: number;
  noveltySpread: number;
}

export interface MetricReading {
  name: string;
  value: number;
  score: number;
  weight: number;
}

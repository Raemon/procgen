import type { AxisSummary } from './latentTypes';

const POWER_ITERATIONS = 60;

export function principalAxes(channels: Float32Array[], axisCount: number): AxisSummary[] {
  if (channels.length === 0) return [];
  const covariance = covarianceMatrix(channels);
  const trace = matrixTrace(covariance);
  const axes: AxisSummary[] = [];
  for (let a = 0; a < Math.min(axisCount, channels.length); a++) {
    const { vector, value } = dominantEigenpair(covariance, a);
    deflate(covariance, vector, value);
    axes.push({ loadings: vector, varianceShare: trace > 0 ? value / trace : 0 });
  }
  return axes;
}

export function axisScoreOf(centroid: number[], axis: AxisSummary): number {
  return centroid.reduce((sum, value, i) => sum + (value - 0.5) * axis.loadings[i]!, 0);
}

function covarianceMatrix(channels: Float32Array[]): number[][] {
  const F = channels.length;
  const means = channels.map(channelMean);
  const matrix = Array.from({ length: F }, () => new Array<number>(F).fill(0));
  for (let a = 0; a < F; a++) {
    for (let b = a; b < F; b++) {
      const value = covarianceOf(channels[a]!, channels[b]!, means[a]!, means[b]!);
      matrix[a]![b] = value;
      matrix[b]![a] = value;
    }
  }
  return matrix;
}

function channelMean(channel: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < channel.length; i++) sum += channel[i]!;
  return sum / channel.length;
}

function covarianceOf(a: Float32Array, b: Float32Array, meanA: number, meanB: number): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += (a[i]! - meanA) * (b[i]! - meanB);
  return sum / a.length;
}

function dominantEigenpair(matrix: number[][], axisIndex: number): { vector: number[]; value: number } {
  const F = matrix.length;
  let vector = normalized(Array.from({ length: F }, (_, i) => 1 + 0.01 * ((i + axisIndex) % F)));
  for (let iteration = 0; iteration < POWER_ITERATIONS; iteration++) {
    vector = normalized(multiply(matrix, vector));
  }
  return { vector, value: dot(vector, multiply(matrix, vector)) };
}

function deflate(matrix: number[][], vector: number[], value: number): void {
  for (let a = 0; a < matrix.length; a++) {
    for (let b = 0; b < matrix.length; b++) {
      matrix[a]![b] = matrix[a]![b]! - value * vector[a]! * vector[b]!;
    }
  }
}

function matrixTrace(matrix: number[][]): number {
  return matrix.reduce((sum, row, i) => sum + row[i]!, 0);
}

function multiply(matrix: number[][], vector: number[]): number[] {
  return matrix.map((row) => dot(row, vector));
}

function dot(a: number[], b: number[]): number {
  return a.reduce((sum, value, i) => sum + value * b[i]!, 0);
}

function normalized(vector: number[]): number[] {
  const length = Math.sqrt(dot(vector, vector)) || 1;
  return vector.map((value) => value / length);
}

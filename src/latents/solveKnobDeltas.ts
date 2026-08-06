import type { KnobJacobian } from './knobJacobian';

const RIDGE = 1e-4;

export function knobFractionsForTarget(jacobian: KnobJacobian, target: number[]): number[] {
  const rows = target.length;
  const gram = gramMatrix(jacobian, rows);
  const weights = solveLinearSystem(gram, target);
  return jacobian.columns.map((column) => dotUpTo(column, weights, rows));
}

export function predictedChange(jacobian: KnobJacobian, fractions: number[]): number[] {
  const rows = jacobian.baseline.length;
  return Array.from({ length: rows }, (_, t) =>
    jacobian.columns.reduce((sum, column, k) => sum + (column[t] ?? 0) * fractions[k]!, 0),
  );
}

function gramMatrix(jacobian: KnobJacobian, rows: number): number[][] {
  const gram = Array.from({ length: rows }, () => new Array<number>(rows).fill(0));
  for (let a = 0; a < rows; a++) {
    for (let b = a; b < rows; b++) {
      const value = jacobian.columns.reduce((sum, column) => sum + (column[a] ?? 0) * (column[b] ?? 0), 0);
      gram[a]![b] = value + (a === b ? RIDGE : 0);
      gram[b]![a] = gram[a]![b]!;
    }
  }
  return gram;
}

function dotUpTo(column: number[], weights: number[], rows: number): number {
  let sum = 0;
  for (let t = 0; t < rows; t++) sum += (column[t] ?? 0) * weights[t]!;
  return sum;
}

function solveLinearSystem(matrix: number[][], rightHandSide: number[]): number[] {
  const size = rightHandSide.length;
  const augmented = matrix.map((row, i) => [...row, rightHandSide[i]!]);
  for (let pivot = 0; pivot < size; pivot++) {
    swapInLargestPivot(augmented, pivot, size);
    eliminateBelow(augmented, pivot, size);
  }
  return backSubstitute(augmented, size);
}

function swapInLargestPivot(augmented: number[][], pivot: number, size: number): void {
  let best = pivot;
  for (let row = pivot + 1; row < size; row++) {
    if (Math.abs(augmented[row]![pivot]!) > Math.abs(augmented[best]![pivot]!)) best = row;
  }
  const swap = augmented[pivot]!;
  augmented[pivot] = augmented[best]!;
  augmented[best] = swap;
}

function eliminateBelow(augmented: number[][], pivot: number, size: number): void {
  const pivotValue = augmented[pivot]![pivot]!;
  if (Math.abs(pivotValue) < 1e-12) return;
  for (let row = pivot + 1; row < size; row++) {
    const factor = augmented[row]![pivot]! / pivotValue;
    for (let column = pivot; column <= size; column++) {
      augmented[row]![column] = augmented[row]![column]! - factor * augmented[pivot]![column]!;
    }
  }
}

function backSubstitute(augmented: number[][], size: number): number[] {
  const solution = new Array<number>(size).fill(0);
  for (let row = size - 1; row >= 0; row--) {
    const pivotValue = augmented[row]![row]!;
    if (Math.abs(pivotValue) < 1e-12) continue;
    let sum = augmented[row]![size]!;
    for (let column = row + 1; column < size; column++) sum -= augmented[row]![column]! * solution[column]!;
    solution[row] = sum / pivotValue;
  }
  return solution;
}

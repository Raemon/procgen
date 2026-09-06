export type NumberedCell = [number, number, number];
export type NamedCell = [string, number, number];

export function numberedCells(raw: unknown): NumberedCell[] {
  return listOf(raw).filter(
    (entry): entry is NumberedCell =>
      Array.isArray(entry) && entry.length === 3 && entry.every(isFiniteNumber),
  );
}

export function namedCells(raw: unknown): NamedCell[] {
  return listOf(raw).filter(
    (entry): entry is NamedCell =>
      Array.isArray(entry) &&
      entry.length === 3 &&
      typeof entry[0] === 'string' &&
      isFiniteNumber(entry[1]) &&
      isFiniteNumber(entry[2]),
  );
}

export function integers(raw: unknown): number[] {
  return listOf(raw).filter((entry): entry is number => Number.isInteger(entry));
}

export function strings(raw: unknown): string[] {
  return listOf(raw).filter((entry): entry is string => typeof entry === 'string');
}

function listOf(raw: unknown): unknown[] {
  return Array.isArray(raw) ? raw : [];
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

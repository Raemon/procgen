export function meanOf(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function shareOf(part: number, whole: number): number {
  return whole === 0 ? 0 : part / whole;
}

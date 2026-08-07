export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

export function isNumberOrNull(value: unknown): value is number | null {
  return value === null || typeof value === 'number';
}

export function isOneOf<T extends string>(options: readonly T[]) {
  return (value: unknown): value is T => options.includes(value as T);
}

export function isRecordOf<T>(isEntry: (value: unknown) => value is T) {
  return (value: unknown): value is Record<string, T> =>
    isPlainObject(value) && Object.values(value).every(isEntry);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

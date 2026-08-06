export type ClassPart = string | false | null | undefined;

export function classes(...parts: ClassPart[]): string {
  return parts.filter(Boolean).join(' ');
}

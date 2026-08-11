const RAIL_INITIALS_LENGTH = 2;

export function railInitials(name: string): string {
  const trimmed = name.trim();
  if (trimmed === '') return '··';
  const words = trimmed.split(/\s+/);
  if (words.length >= RAIL_INITIALS_LENGTH) {
    return words
      .slice(0, RAIL_INITIALS_LENGTH)
      .map((word) => word[0])
      .join('');
  }
  return trimmed.slice(0, RAIL_INITIALS_LENGTH);
}

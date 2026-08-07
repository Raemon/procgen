export function toggledMembers(members: readonly string[], member: string): string[] {
  const next = new Set(members);
  if (!next.delete(member)) next.add(member);
  return [...next];
}

export function freeWorldSeedName(wanted: string, taken: Iterable<string>): string {
  const names = new Set(taken);
  if (!names.has(wanted)) return wanted;
  let attempt = 2;
  while (names.has(`${wanted} ${attempt}`)) attempt += 1;
  return `${wanted} ${attempt}`;
}

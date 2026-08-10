export function freeWorldName(wanted: string, taken: readonly string[]): string {
  if (!taken.includes(wanted)) return wanted;
  let attempt = 2;
  while (taken.includes(`${wanted} ${attempt}`)) attempt += 1;
  return `${wanted} ${attempt}`;
}

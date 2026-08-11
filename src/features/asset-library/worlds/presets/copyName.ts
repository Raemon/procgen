export function copyNameFor(name: string, taken: readonly string[]): string {
  const wanted = `${name} copy`;
  if (!taken.includes(wanted)) return wanted;
  let attempt = 2;
  while (taken.includes(`${wanted} ${attempt}`)) attempt += 1;
  return `${wanted} ${attempt}`;
}

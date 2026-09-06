export type UseOutcome = { ok: true; summary: string } | { ok: false; code: string; hint: string };

export function nothingToUse(x: number, y: number): UseOutcome {
  return { ok: false, code: 'nothing_to_use', hint: `nothing to work at (${x},${y})` };
}

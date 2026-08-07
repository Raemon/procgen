const SAY_BURST = 3;
const SAY_REFILL_MS = 1500;

export interface SayAllowance {
  budget: number;
  refilledAt: number;
}

export function newSayAllowance(): SayAllowance {
  return { budget: SAY_BURST, refilledAt: 0 };
}

export function takeSayAllowance(allowance: SayAllowance, now: number): boolean {
  refill(allowance, now);
  if (allowance.budget < 1) return false;
  allowance.budget -= 1;
  return true;
}

function refill(allowance: SayAllowance, now: number): void {
  if (allowance.refilledAt === 0) allowance.refilledAt = now;
  const refills = Math.floor((now - allowance.refilledAt) / SAY_REFILL_MS);
  if (refills < 1) return;
  allowance.budget = Math.min(SAY_BURST, allowance.budget + refills);
  allowance.refilledAt += refills * SAY_REFILL_MS;
}

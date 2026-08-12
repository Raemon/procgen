export const TRIGGER_STEP_ON = 0;
export const TRIGGER_USE = 1;
export const TRIGGER_CONTACT = 2;
export const TRIGGER_TICK = 3;

export const TRIGGER_NAMES = ['step_on', 'use', 'contact', 'tick'] as const;

export const VITALITY_TOKEN = 0;
export const UNLIMITED_CHARGES = 0;
export const STARTING_VITALITY = 12;
export const MOST_VITALITY_CARRIED = 24;

export interface TokenAmount {
  tokenType: number;
  amount: number;
}

export interface TransitionRule {
  trigger: number;
  charges: number;
  requires: TokenAmount[];
  consumes: TokenAmount[];
  produces: TokenAmount[];
}

export function triggerName(trigger: number): string {
  return TRIGGER_NAMES[trigger] ?? TRIGGER_NAMES[TRIGGER_USE];
}

export function tokenTypesOf(rule: TransitionRule): number[] {
  return [...rule.requires, ...rule.consumes, ...rule.produces].map((each) => each.tokenType);
}

export function amountOfToken(amounts: readonly TokenAmount[], tokenType: number): number {
  return amounts.find((each) => each.tokenType === tokenType)?.amount ?? 0;
}

export function costsVitality(rule: TransitionRule): boolean {
  return amountOfToken(rule.consumes, VITALITY_TOKEN) > 0;
}

export function paysVitality(rule: TransitionRule): boolean {
  return amountOfToken(rule.produces, VITALITY_TOKEN) > 0;
}

export function whatTheRuleAsksToHold(rule: TransitionRule): TokenAmount[] {
  return [...rule.requires, ...rule.consumes];
}

export function ruleShapeKey(rule: TransitionRule): string {
  const slots = [rule.requires, rule.consumes, rule.produces].map(amountsKey);
  return [rule.trigger, ...slots].join('|');
}

function amountsKey(amounts: readonly TokenAmount[]): string {
  return [...amounts]
    .slice()
    .sort((a, b) => a.tokenType - b.tokenType)
    .map((each) => `${each.tokenType}x${each.amount}`)
    .join(',');
}

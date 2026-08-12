import type { PointData } from '../../procgen/values/chunkValues';
import {
  TRIGGER_USE,
  UNLIMITED_CHARGES,
  type TokenAmount,
  type TransitionRule,
} from './transitionRule';

export const TRIGGER_KEY = 'trigger';
export const CHARGES_KEY = 'charges';
export const GOAL_DEPTH_KEY = 'goalDepth';

const SLOT_KEYS = { requires: 'req', consumes: 'con', produces: 'pro' } as const;

type SlotName = keyof typeof SLOT_KEYS;

export function ruleAsPointData(rule: TransitionRule, goalDepth: number): PointData {
  return {
    [TRIGGER_KEY]: rule.trigger,
    [CHARGES_KEY]: rule.charges,
    [GOAL_DEPTH_KEY]: goalDepth,
    ...slotAsPointData('requires', rule.requires),
    ...slotAsPointData('consumes', rule.consumes),
    ...slotAsPointData('produces', rule.produces),
  };
}

export function ruleFromPointData(data: PointData | undefined): TransitionRule | null {
  if (!data || typeof data[TRIGGER_KEY] !== 'number') return null;
  return {
    trigger: wholeNumber(data[TRIGGER_KEY], TRIGGER_USE),
    charges: wholeNumber(data[CHARGES_KEY], UNLIMITED_CHARGES),
    requires: slotFromPointData(data, 'requires'),
    consumes: slotFromPointData(data, 'consumes'),
    produces: slotFromPointData(data, 'produces'),
  };
}

export function goalDepthOfPointData(data: PointData | undefined): number {
  return wholeNumber(data?.[GOAL_DEPTH_KEY], 0);
}

function slotAsPointData(slot: SlotName, amounts: readonly TokenAmount[]): PointData {
  const written: Record<string, number> = { [countKey(slot)]: amounts.length };
  amounts.forEach((each, index) => {
    written[typeKey(slot, index)] = each.tokenType;
    written[amountKey(slot, index)] = each.amount;
  });
  return written;
}

function slotFromPointData(data: PointData, slot: SlotName): TokenAmount[] {
  const amounts: TokenAmount[] = [];
  for (let index = 0; index < wholeNumber(data[countKey(slot)], 0); index++) {
    amounts.push({
      tokenType: wholeNumber(data[typeKey(slot, index)], 0),
      amount: wholeNumber(data[amountKey(slot, index)], 0),
    });
  }
  return amounts.filter((each) => each.amount > 0);
}

function countKey(slot: SlotName): string {
  return `${SLOT_KEYS[slot]}Count`;
}

function typeKey(slot: SlotName, index: number): string {
  return `${SLOT_KEYS[slot]}${index}Type`;
}

function amountKey(slot: SlotName, index: number): string {
  return `${SLOT_KEYS[slot]}${index}Amount`;
}

function wholeNumber(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : fallback;
}

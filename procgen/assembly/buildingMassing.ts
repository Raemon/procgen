import type { RandomStream } from '../random/mulberry32';
import { massingRulesFor, MAX_WING_SIDE, type MassingRules } from './buildingPrograms';

export interface RoomBox {
  x: number;
  y: number;
  width: number;
  depth: number;
}

export function massingFor(program: number, rng: RandomStream): RoomBox[] {
  const rules = massingRulesFor(program);
  const main = mainBoxOf(rules, rng);
  const wanted = rng() < rules.wingChance;
  const wing = wingBoxOf(rules, main, rng);
  return wanted && wing ? [main, wing] : [main];
}

export function massingExtent(boxes: readonly RoomBox[]): { width: number; depth: number } {
  return {
    width: Math.max(...boxes.map((box) => box.x + box.width)),
    depth: Math.max(...boxes.map((box) => box.y + box.depth)),
  };
}

export function footprintWithYard(program: number, boxes: readonly RoomBox[]): number {
  const extent = massingExtent(boxes);
  return Math.max(extent.width, extent.depth) + 2 * massingRulesFor(program).yard;
}

function mainBoxOf(rules: MassingRules, rng: RandomStream): RoomBox {
  return {
    x: 0,
    y: 0,
    width: sideBetween(rules.minW, rules.maxW, rng),
    depth: sideBetween(rules.minD, rules.maxD, rng),
  };
}

function wingBoxOf(rules: MassingRules, main: RoomBox, rng: RandomStream): RoomBox | null {
  const width = sideBetween(4, Math.min(MAX_WING_SIDE, rules.maxW - 2), rng);
  const depth = sideBetween(4, Math.min(MAX_WING_SIDE, main.depth), rng);
  const offset = Math.floor(rng() * (main.depth - depth + 1));
  if (width < 4 || depth < 4) return null;
  return { x: main.width - 1, y: offset, width, depth };
}

function sideBetween(min: number, max: number, rng: RandomStream): number {
  if (max <= min) return min;
  return min + Math.floor(rng() * (max - min + 1));
}

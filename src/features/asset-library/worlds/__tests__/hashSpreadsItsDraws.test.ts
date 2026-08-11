import { hashLatticePoint } from '../noise/hashLatticePoint';
import { hashString } from '../random/hashString';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';

const SPAN = 40;

export function checkHashSpreadsItsDraws(check: CheckReporter): void {
  check(
    'a lattice cell never draws what its mirror through the origin draws, so worlds are not symmetric',
    everyLatticeCell((x, y) => hashLatticePoint(x, y, 7) !== hashLatticePoint(-x, -y, 7)),
  );
  check(
    'swapping a lattice cell x and y changes its draw, except on the diagonal where they are one cell',
    everyLatticeCell((x, y) => x === y || hashLatticePoint(x, y, 7) !== hashLatticePoint(y, x, 7)),
  );
  check(
    'lattice draws fill every tenth of the range, so no band of values is starved',
    everyDecileFilled(latticeDraws()),
  );
  check(
    'labels differing only in a trailing digit land in unrelated places, not in a drifting run',
    everyDecileFilled(trailingDigitDraws()),
  );
}

function everyLatticeCell(holds: (x: number, y: number) => boolean): boolean {
  for (let x = -SPAN; x <= SPAN; x++) {
    for (let y = -SPAN; y <= SPAN; y++) if (!(x === 0 && y === 0) && !holds(x, y)) return false;
  }
  return true;
}

function latticeDraws(): number[] {
  const draws: number[] = [];
  for (let x = -SPAN; x <= SPAN; x++) {
    for (let y = -SPAN; y <= SPAN; y++) draws.push(hashLatticePoint(x, y, 7));
  }
  return draws;
}

function trailingDigitDraws(): number[] {
  const draws: number[] = [];
  for (let i = 0; i < 200; i++) draws.push(hashString(`west doors:${i}`) / 4294967296);
  return draws;
}

function everyDecileFilled(draws: readonly number[]): boolean {
  const deciles = new Set(draws.map((draw) => Math.min(9, Math.floor(draw * 10))));
  return deciles.size === 10;
}

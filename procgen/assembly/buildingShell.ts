import type { RandomStream } from '../random/mulberry32';
import type { RoomBox } from './buildingMassing';
import { FACING_STEPS, normalizedFacing } from './buildingSpec';

type ShellRole = 'corner' | 'wall' | 'floor' | 'outside';

export interface ShellCell {
  x: number;
  y: number;
  role: ShellRole;
  facing: number;
}

function isInsideBoxes(boxes: readonly RoomBox[], x: number, y: number): boolean {
  return boxes.some(
    (box) => x >= box.x && y >= box.y && x < box.x + box.width && y < box.y + box.depth,
  );
}

function shellRoleAt(boxes: readonly RoomBox[], x: number, y: number): ShellRole {
  if (!isInsideBoxes(boxes, x, y)) return 'outside';
  const openSides = outwardFacingsAt(boxes, x, y);
  if (openSides.length === 0) return 'floor';
  return hasPerpendicularPair(openSides) ? 'corner' : 'wall';
}

function outwardFacingsAt(boxes: readonly RoomBox[], x: number, y: number): number[] {
  return FACING_STEPS.map((step, facing) => ({ step, facing }))
    .filter(({ step }) => !isInsideBoxes(boxes, x + step[0], y + step[1]))
    .map(({ facing }) => facing);
}

export function shellCellsOf(boxes: readonly RoomBox[]): ShellCell[] {
  const cells: ShellCell[] = [];
  forEachFootprintCell(boxes, (x, y) => {
    const role = shellRoleAt(boxes, x, y);
    if (role !== 'outside') cells.push({ x, y, role, facing: outwardFacingsAt(boxes, x, y)[0] ?? 0 });
  });
  return cells;
}

function forEachFootprintCell(
  boxes: readonly RoomBox[],
  visit: (x: number, y: number) => void,
): void {
  const width = Math.max(...boxes.map((box) => box.x + box.width));
  const depth = Math.max(...boxes.map((box) => box.y + box.depth));
  for (let y = 0; y < depth; y++) for (let x = 0; x < width; x++) visit(x, y);
}

export function doorCellOf(
  boxes: readonly RoomBox[],
  facing: number,
  rng: RandomStream,
): ShellCell | null {
  const candidates = doorCandidatesOf(boxes, facing);
  const roll = rng();
  if (candidates.length === 0) return null;
  return candidates[Math.min(candidates.length - 1, Math.floor(roll * candidates.length))]!;
}

export function isWindowCell(cell: ShellCell, windowEvery: number, door: ShellCell | null): boolean {
  if (cell.role !== 'wall') return false;
  if (door && door.x === cell.x && door.y === cell.y) return false;
  return positionAlongWall(cell) % Math.max(1, windowEvery) === 0;
}

function doorCandidatesOf(boxes: readonly RoomBox[], facing: number): ShellCell[] {
  const wanted = normalizedFacing(facing);
  return shellCellsOf(boxes).filter(
    (cell) => cell.role === 'wall' && cell.facing === wanted,
  );
}

function positionAlongWall(cell: ShellCell): number {
  return cell.facing % 2 === 0 ? cell.x : cell.y;
}

function hasPerpendicularPair(facings: readonly number[]): boolean {
  return facings.some((facing) => facings.some((other) => (other - facing + 4) % 4 === 1));
}

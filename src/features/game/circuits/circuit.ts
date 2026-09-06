import type { Cell } from '../worldRules';

export interface CircuitPlate extends Cell {
  lit: boolean;
}

export interface CircuitDoor extends Cell {
  open: boolean;
}

export interface Circuit {
  key: string;
  plates: CircuitPlate[];
  doors: CircuitDoor[];
  wires: Cell[];
  powered: boolean;
}

export function cellKeyOf(cell: Cell): string {
  return `${cell.x},${cell.y}`;
}

export function cellWithin(cell: Cell, minX: number, minY: number, maxX: number, maxY: number): boolean {
  return cell.x >= minX && cell.x <= maxX && cell.y >= minY && cell.y <= maxY;
}

export function circuitTouches(
  circuit: Circuit,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
): boolean {
  const within = (cell: Cell) => cellWithin(cell, minX, minY, maxX, maxY);
  return circuit.wires.some(within) || circuit.plates.some(within) || circuit.doors.some(within);
}

export interface WireCell {
  x: number;
  y: number;
}

export interface CircuitPlate extends WireCell {
  lit: boolean;
}

export interface CircuitDoor extends WireCell {
  open: boolean;
}

export interface Circuit {
  key: string;
  plates: CircuitPlate[];
  doors: CircuitDoor[];
  wires: WireCell[];
  powered: boolean;
}

export function cellKeyOf(cell: WireCell): string {
  return `${cell.x},${cell.y}`;
}

export function circuitTouches(
  circuit: Circuit,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
): boolean {
  const within = (cell: WireCell) => cell.x >= minX && cell.x <= maxX && cell.y >= minY && cell.y <= maxY;
  return circuit.wires.some(within) || circuit.plates.some(within) || circuit.doors.some(within);
}

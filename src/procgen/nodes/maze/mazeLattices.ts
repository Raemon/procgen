export interface MazeLattice {
  pitch: number;
  room: number;
  wall: number;
}

const LATTICE_SPECS = {
  capillary: { pitch: 2, room: 1 },
  warren: { pitch: 4, room: 2 },
  classic: { pitch: 4, room: 3 },
  atrium: { pitch: 8, room: 6 },
  cathedral: { pitch: 8, room: 7 },
} as const;

export const LATTICE_NAMES = Object.keys(LATTICE_SPECS) as readonly string[];

export function latticeByName(name: string): MazeLattice {
  const spec = LATTICE_SPECS[name as keyof typeof LATTICE_SPECS] ?? LATTICE_SPECS.classic;
  return { pitch: spec.pitch, room: spec.room, wall: spec.pitch - spec.room };
}

export function latticeCells(lattice: MazeLattice, chunkSize: number): number {
  return Math.floor(chunkSize / lattice.pitch);
}

export function hashLatticePoint(latticeX: number, latticeY: number, seed: number): number {
  let hash = (seed + Math.imul(latticeX, 0x27d4eb2d) + Math.imul(latticeY, 0x165667b1)) | 0;
  hash = Math.imul(hash ^ (hash >>> 15), 0x85ebca6b);
  hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35);
  return ((hash ^ (hash >>> 16)) >>> 0) / 4294967296;
}

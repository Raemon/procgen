import type { CharacterRotation } from './characterBillboard';

const SECTORS = 8;
const SECTOR_RADIANS = (Math.PI * 2) / SECTORS;

const ROTATION_BY_SECTOR: readonly CharacterRotation[] = [
  'back',
  'backQuarter',
  'side',
  'frontQuarter',
  'front',
];

export interface ViewRelativeRotation {
  rotation: CharacterRotation;
  mirrored: boolean;
}

export function headingRadians(dx: number, dy: number): number {
  return Math.atan2(dx, -dy);
}

export function viewRelativeRotation(
  heading: number,
  cameraYaw: number,
): ViewRelativeRotation {
  const sector = sectorOf(heading - cameraYaw);
  const mirrored = sector > SECTORS / 2;
  const folded = mirrored ? SECTORS - sector : sector;
  return { rotation: ROTATION_BY_SECTOR[folded]!, mirrored };
}

function sectorOf(radians: number): number {
  const turns = radians / SECTOR_RADIANS;
  return ((Math.round(turns) % SECTORS) + SECTORS) % SECTORS;
}

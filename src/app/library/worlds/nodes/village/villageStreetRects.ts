import type { VillageHashSeed } from './villageHashSeed';
import { rectFromBounds, type VillageRect } from './villageRect';

export interface VillageStreetKnobs {
  radius: number;
  plotCells: number;
  streetWidth: number;
}

export interface VillageAxis {
  horizontal: boolean;
  mirrored: boolean;
}

export function axisForCenter(hashSeed: VillageHashSeed): VillageAxis {
  const orientation = hashSeed('street axis') % 4;
  return { horizontal: orientation % 2 === 0, mirrored: orientation >= 2 };
}

export function mainStreetRect(
  axis: VillageAxis,
  centerX: number,
  centerY: number,
  knobs: VillageStreetKnobs,
): VillageRect {
  const half = Math.floor(knobs.streetWidth / 2);
  if (axis.horizontal) {
    return rectFromBounds(
      centerX - knobs.radius,
      centerY - half,
      centerX + knobs.radius,
      centerY - half + knobs.streetWidth - 1,
    );
  }
  return rectFromBounds(
    centerX - half,
    centerY - knobs.radius,
    centerX - half + knobs.streetWidth - 1,
    centerY + knobs.radius,
  );
}

export function crossLaneRect(
  axis: VillageAxis,
  centerX: number,
  centerY: number,
  knobs: VillageStreetKnobs,
): VillageRect | null {
  if (knobs.radius < 2 * knobs.plotCells) return null;
  const reach = Math.floor(knobs.radius / 2);
  return mainStreetRect({ ...axis, horizontal: !axis.horizontal }, centerX, centerY, {
    ...knobs,
    radius: reach,
  });
}

export function plazaRect(
  centerX: number,
  centerY: number,
  knobs: VillageStreetKnobs,
): VillageRect {
  const half = Math.floor(knobs.streetWidth / 2) + 1;
  return rectFromBounds(centerX - half, centerY - half, centerX + half, centerY + half);
}

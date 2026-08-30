export const WORLDS_CAMERAS = ['ascii', '3d-god'] as const;

export type WorldsCamera = (typeof WORLDS_CAMERAS)[number];

export function isWorldsCamera(value: unknown): value is WorldsCamera {
  return WORLDS_CAMERAS.some((camera) => camera === value);
}

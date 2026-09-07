import type { CubeFaceArt } from '@/features/asset-library/tiles/tileFaceArt';

export interface FixtureLook {
  glyph: string;
  color: string;
  tag: string;
  faceArt: CubeFaceArt | null;
  standingHeight?: number;
  seeThroughUnpaintedArt?: boolean;
  glow?: number;
  footprint?: number;
  gateOpenness?: number;
}

export type DoorLock = 'key' | 'mechanism';

export interface LookPair {
  off: FixtureLook;
  on: FixtureLook;
}

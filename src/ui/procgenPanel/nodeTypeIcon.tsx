import type { ReactNode } from 'react';
import { Icon } from '../icons/Icon';

/**
 * One glyph per node type, so a collapsed card still says what it does.
 * Every registered type gets an entry; unknown types fall back to a plain box.
 */
const NODE_TYPE_ICONS: Readonly<Record<string, ReactNode>> = {
  // examples
  constantField: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 12h10" />
    </>
  ),
  noiseField: (
    <>
      <path d="M2.5 14c1.8-5.5 3.2 3.5 5-1.5s3.2 4.5 5-1S15.7 14 17.5 9.5 20.5 8 21.5 10" />
      <path d="M2.5 19h19" />
    </>
  ),
  combineFields: (
    <>
      <circle cx="9" cy="12" r="6" />
      <circle cx="15" cy="12" r="6" />
    </>
  ),
  thresholdTiles: (
    <>
      <path d="M3 18h6v-6h6V6h6" />
      <path d="M3 21v-2" />
    </>
  ),
  scatterPoints: (
    <>
      <circle cx="6" cy="8" r="1.3" />
      <circle cx="12.5" cy="5.5" r="1.3" />
      <circle cx="17.5" cy="10" r="1.3" />
      <circle cx="8.5" cy="15" r="1.3" />
      <circle cx="15" cy="18" r="1.3" />
    </>
  ),

  // terrain
  terrainNoise: (
    <>
      <path d="M2.5 19 9 8l4.5 7 2.5-3.5L21.5 19Z" />
      <path d="M6.5 13.5h5" />
    </>
  ),
  tectonicUplift: (
    <>
      <path d="M3 16h7l2-4 2 4h7" />
      <path d="M12 9V3" />
      <path d="M9.5 5.5 12 3l2.5 2.5" />
      <path d="M3 20h18" />
    </>
  ),
  domainWarp: (
    <>
      <path d="M4 6c4 4 12-4 16 0" />
      <path d="M4 12c4 4 12-4 16 0" />
      <path d="M4 18c4 4 12-4 16 0" />
    </>
  ),
  hypsometricCurve: (
    <>
      <path d="M4 20V4" />
      <path d="M4 20h16" />
      <path d="M5 17c4 0 5-11 14-12" />
    </>
  ),
  blendFields: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5a8.5 8.5 0 0 1 0 17Z" fill="currentColor" stroke="none" />
    </>
  ),
  slopeField: (
    <>
      <path d="M4 19h16L4 6Z" />
      <path d="M9 15.5 15 18" />
    </>
  ),

  // water
  coastDistance: (
    <>
      <path d="M3 5c4 3 4 11 0 14" />
      <path d="M8.5 6c3.5 3 3.5 9 0 12" />
      <path d="M14 7.5c2.5 2 2.5 7 0 9" />
      <circle cx="20" cy="12" r="1.2" />
    </>
  ),
  fillDepressions: (
    <>
      <path d="M4 6c0 8 3 12 8 12s8-4 8-12" />
      <path d="M5 11h14" />
    </>
  ),
  flowAccumulation: (
    <>
      <path d="M4 4c2 5 5 6 8 8" />
      <path d="M12 4c-.5 4-1 6 0 8" />
      <path d="M20 4c-2 5-5 6-8 8" />
      <path d="M12 12v8" />
    </>
  ),
  carveValleys: (
    <>
      <path d="M3 5 10 19h4L21 5" />
      <path d="M10.5 12h3" />
    </>
  ),
  riverFromFlow: (
    <>
      <path d="M4 3c0 5 6 5 6 10s-4 4-4 8" />
      <path d="M14 4c3 3 6 3 6 7" />
    </>
  ),
  riverTiles: (
    <>
      <path d="M6 3c0 6 8 6 8 12s-4 4-4 6" />
      <rect x="15.5" y="12.5" width="6" height="6" rx="1" />
    </>
  ),
  riverTowns: (
    <>
      <path d="M3 3c0 7 4 9 4 18" />
      <path d="M11 14v6h5v-6" />
      <path d="M9.5 15 13.5 11.5 17.5 15" />
      <path d="M19 20h2" />
    </>
  ),

  // biome
  biomeBands: (
    <>
      <path d="M3 6.5h18" />
      <path d="M3 12h18" />
      <path d="M3 17.5h18" />
      <circle cx="8" cy="9.2" r="1" />
      <circle cx="16" cy="14.8" r="1" />
    </>
  ),

  // maze
  mazeChunk: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="1.5" />
      <path d="M7 3v10h4V7h6" />
      <path d="M3 17h8v4" />
      <path d="M15 21v-4h6" />
    </>
  ),

  // custom
  customScript: (
    <>
      <path d="M8.5 8 4 12l4.5 4" />
      <path d="M15.5 8 20 12l-4.5 4" />
      <path d="M13.5 5 10.5 19" />
    </>
  ),
};

const FALLBACK_ICON = (
  <>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="M9 12h6" />
  </>
);

export function NodeTypeIcon({ type, size }: { type: string; size?: number }) {
  return <Icon size={size}>{NODE_TYPE_ICONS[type] ?? FALLBACK_ICON}</Icon>;
}

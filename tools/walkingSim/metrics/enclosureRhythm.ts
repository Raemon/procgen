import { cellsInSightDisc } from '../isovist';

const OPEN_SHARE_OF_DISC = 0.5;
const ENCLOSED_SHARE_OF_DISC = 0.2;

type Enclosure = 'open' | 'enclosed' | 'between';

export interface EnclosureRhythm {
  timeShareOpen: number;
  timeShareEnclosed: number;
  opennessSwingsPer100Steps: number;
}

export function enclosureRhythm(
  isovistAreaPerStep: number[],
  sightRadius: number,
): EnclosureRhythm {
  const bands = isovistAreaPerStep.map((area) => enclosureOf(area, cellsInSightDisc(sightRadius)));
  return {
    timeShareOpen: shareOfSteps(bands, 'open'),
    timeShareEnclosed: shareOfSteps(bands, 'enclosed'),
    opennessSwingsPer100Steps: swingsPer100Steps(bands),
  };
}

function enclosureOf(isovistArea: number, discCells: number): Enclosure {
  if (isovistArea > discCells * OPEN_SHARE_OF_DISC) return 'open';
  if (isovistArea < discCells * ENCLOSED_SHARE_OF_DISC) return 'enclosed';
  return 'between';
}

function shareOfSteps(bands: Enclosure[], band: Enclosure): number {
  if (bands.length === 0) return 0;
  return bands.filter((step) => step === band).length / bands.length;
}

function swingsPer100Steps(bands: Enclosure[]): number {
  if (bands.length === 0) return 0;
  return (swingCount(bands) / bands.length) * 100;
}

function swingCount(bands: Enclosure[]): number {
  let swings = 0;
  let settled: Enclosure = 'between';
  for (const band of bands) {
    if (band === 'between' || band === settled) continue;
    if (settled !== 'between') swings++;
    settled = band;
  }
  return swings;
}

import { massingRulesFor } from '../../assembly/buildingPrograms';
import { PROGRAM_CATALOG, programIndexByName } from '../../assembly/programCatalog';
import type { VillageHashSeed } from './villageHashSeed';

export const COTTAGE = programIndexByName('cottage');
export const DWELLING = programIndexByName('dwelling');
export const SMITHY = programIndexByName('smithy');
export const INN = programIndexByName('inn');
export const TOWN_HALL = programIndexByName('townHall');

export const DEFAULT_PROGRAM_WEIGHTS: readonly number[] = PROGRAM_CATALOG.map(
  (def) => def.defaultWeight,
);

export interface PlotProgramChoice {
  slotIndex: number;
  ring: number;
  plotCells: number;
  weights: readonly number[];
}

export function programForSlot(choice: PlotProgramChoice, hashSeed: VillageHashSeed): number {
  const wanted = wantedProgramOf(choice, hashSeed);
  return fitsPlot(wanted, choice.plotCells) ? wanted : COTTAGE;
}

function wantedProgramOf(choice: PlotProgramChoice, hashSeed: VillageHashSeed): number {
  if (choice.slotIndex === 0 && weightOf(choice, TOWN_HALL) > 0) return TOWN_HALL;
  const civicSlot = choice.slotIndex - 1;
  if (civicSlot < weightOf(choice, INN)) return INN;
  if (civicSlot < weightOf(choice, INN) + weightOf(choice, SMITHY)) return SMITHY;
  return outerProgramOf(choice, hashSeed);
}

function outerProgramOf(choice: PlotProgramChoice, hashSeed: VillageHashSeed): number {
  const cottageWeight = weightOf(choice, COTTAGE);
  const total = cottageWeight + weightOf(choice, DWELLING);
  if (total <= 0) return COTTAGE;
  return hashSeed(`plot program ${choice.slotIndex}`) % total < cottageWeight ? COTTAGE : DWELLING;
}

function weightOf(choice: PlotProgramChoice, program: number): number {
  return Math.max(0, Math.round(choice.weights[program] ?? 0));
}

function fitsPlot(program: number, plotCells: number): boolean {
  const rules = massingRulesFor(program);
  return rules.maxW <= plotCells && rules.maxD <= plotCells;
}

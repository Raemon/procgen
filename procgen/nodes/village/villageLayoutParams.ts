import type { ChunkGenCtx, KnobParamSpec } from '../../nodeType';
import type { VillageLayoutKnobs } from './villageLayout';
import { DEFAULT_PROGRAM_WEIGHTS } from './villagePlotPrograms';

export const VILLAGE_LAYOUT_PARAMS: Record<string, KnobParamSpec> = {
  radius: {
    kind: 'int',
    label: 'village radius',
    help: 'How far in tiles the streets and plots of one village reach from its center. Keep this the same on the plots and streets nodes.',
    min: 16,
    max: 96,
    default: 48,
  },
  plotCells: {
    kind: 'int',
    label: 'plot size',
    help: 'Side of one building plot in tiles. Bigger plots leave room for the larger programs, smaller plots pack cottages together.',
    min: 8,
    max: 24,
    default: 16,
  },
  streetWidth: {
    kind: 'int',
    label: 'street width',
    help: 'Width in tiles of the main street, the cross lane and the plaza that opens where they meet.',
    min: 1,
    max: 7,
    default: 3,
  },
};

export function villageLayoutKnobsOf(
  ctx: ChunkGenCtx,
  weights: readonly number[] = DEFAULT_PROGRAM_WEIGHTS,
): VillageLayoutKnobs {
  return {
    radius: ctx.params.radius as number,
    plotCells: ctx.params.plotCells as number,
    streetWidth: ctx.params.streetWidth as number,
    weights,
  };
}

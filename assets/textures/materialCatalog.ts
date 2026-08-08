import type { MaterialSynth } from './materialSynth';
import { cobbles } from './synth/cobbles';
import { dressedGranite } from './synth/dressedGranite';
import { fieldstone } from './synth/fieldstone';
import { flagstone } from './synth/flagstone';
import { forgeCoals, rivetedIron } from './synth/forgeMaterials';
import { forestLoam, grassTurf, meadowTurf, rammedEarth, troddenEarth } from './synth/groundMaterials';
import { limewashWattle } from './synth/limewashWattle';
import { duneSand, gravel, scree } from './synth/looseMaterials';
import { oakBeam } from './synth/oakBeam';
import { oakPlank } from './synth/oakPlank';
import { slateShingle } from './synth/slateShingle';
import { stillWater } from './synth/stillWater';
import { thatch } from './synth/thatch';

export const MATERIAL_SYNTHS: MaterialSynth[] = [
  dressedGranite,
  fieldstone,
  slateShingle,
  thatch,
  oakPlank,
  oakBeam,
  limewashWattle,
  cobbles,
  flagstone,
  troddenEarth,
  rammedEarth,
  forestLoam,
  grassTurf,
  meadowTurf,
  duneSand,
  gravel,
  scree,
  stillWater,
  rivetedIron,
  forgeCoals,
];

export function materialSynthById(id: string): MaterialSynth | undefined {
  return MATERIAL_SYNTHS.find((material) => material.id === id);
}

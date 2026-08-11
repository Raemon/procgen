export const FINISH_ADJECTIVES: readonly string[] = [
  'weathered',
  'moss-flecked',
  'sun-bleached',
  'rain-worn',
  'soot-darkened',
  'lichen-crusted',
  'frost-bitten',
  'wind-scoured',
  'smoke-stained',
  'hand-hewn',
  'close-set',
  'salt-worn',
  'time-smoothed',
  'ash-dusted',
  'tar-sealed',
  'pale-limed',
];

const MATERIAL_WORDS: Record<string, readonly string[]> = {
  dressedGranite: ['granite', 'dressed granite'],
  fieldstone: ['fieldstone', 'rubble stone'],
  slateShingle: ['slate', 'shingled slate'],
  thatch: ['thatch', 'reed thatch'],
  oakPlank: ['oak plank', 'sawn oak'],
  oakBeam: ['oak beam', 'cruck oak'],
  limewashWattle: ['limewashed wattle', 'daubed wattle'],
  cobbles: ['cobble', 'setted cobble'],
  flagstone: ['flagstone', 'slabbed flag'],
  troddenEarth: ['trodden earth', 'beaten earth'],
  rammedEarth: ['rammed earth', 'cob'],
  forestLoam: ['loam', 'woodland loam'],
  grassTurf: ['turf', 'cut turf'],
  meadowTurf: ['meadow turf', 'flowered turf'],
  duneSand: ['dune sand', 'drift sand'],
  gravel: ['gravel', 'grit'],
  scree: ['scree', 'shale scree'],
  stillWater: ['still water', 'pooled water'],
  rivetedIron: ['riveted iron', 'strapped iron'],
  forgeCoals: ['forge coal', 'banked ember'],
};

const UNNAMED_MATERIAL_WORDS: readonly string[] = ['plain stone', 'rough stone'];

export function materialWordsOf(materialId: string): readonly string[] {
  return MATERIAL_WORDS[materialId] ?? UNNAMED_MATERIAL_WORDS;
}

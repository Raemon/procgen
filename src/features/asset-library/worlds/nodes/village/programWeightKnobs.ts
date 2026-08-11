import { PROGRAM_CATALOG } from '../../assembly/programCatalog';
import type { KnobParamSpec } from '../../nodeType';

export function programWeightKnobs(): Record<string, KnobParamSpec> {
  const knobs: Record<string, KnobParamSpec> = {};
  for (const def of PROGRAM_CATALOG) knobs[weightKnobName(def.name)] = weightKnob(def);
  return knobs;
}

export function weightKnobName(programName: string): string {
  return `${programName}Weight`;
}

function weightKnob(def: (typeof PROGRAM_CATALOG)[number]): KnobParamSpec {
  return {
    kind: 'int',
    label: `${def.name} share`,
    help: def.weightHelp,
    min: 0,
    max: 8,
    default: def.defaultWeight,
  };
}

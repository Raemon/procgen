import { PROGRAM_CATALOG } from '../../assembly/programCatalog';
import type { KnobParamSpec } from '../../nodeType';

export function programWeightKnobs(): Record<string, KnobParamSpec> {
  const knobs: Record<string, KnobParamSpec> = {};
  for (const def of PROGRAM_CATALOG) {
    knobs[weightKnobName(def.name)] = weightKnob(def.name, def.defaultWeight);
  }
  return knobs;
}

export function weightKnobName(programName: string): string {
  return `${programName}Weight`;
}

function weightKnob(programName: string, defaultWeight: number): KnobParamSpec {
  return {
    kind: 'int',
    label: `${programName} share`,
    help: `Relative share of plots offered to the ${programName} program; 0 keeps it out of the village.`,
    min: 0,
    max: 8,
    default: defaultWeight,
  };
}

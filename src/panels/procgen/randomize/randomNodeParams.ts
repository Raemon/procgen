import type { RandomStream } from '../../../random/mulberry32';
import { defaultParamValue, type NodeTypeDef, type ParamSpec, type ParamValue } from '../../../procgen/nodeType';
import { chance, pick, rollBetween, rollInt, snappedToStep } from './randomRolls';

export function randomParams(
  def: NodeTypeDef,
  rng: RandomStream,
  tileIds: readonly number[],
): Record<string, ParamValue> {
  const params: Record<string, ParamValue> = {};
  for (const [name, spec] of Object.entries(def.params)) {
    params[name] = randomParamValue(spec, rng, tileIds);
  }
  return params;
}

function randomParamValue(
  spec: ParamSpec,
  rng: RandomStream,
  tileIds: readonly number[],
): ParamValue {
  if (spec.kind === 'number') return snappedToStep(rollBetween(rng, spec.min, spec.max), spec.min, spec.max, spec.step);
  if (spec.kind === 'int') return rollInt(rng, spec.min, spec.max);
  if (spec.kind === 'toggle') return chance(rng, 0.5) ? 1 : 0;
  if (spec.kind === 'choice') return pick(rng, spec.options).value;
  if (spec.kind === 'tile') return tileIds.length > 0 ? pick(rng, tileIds) : -1;
  return defaultParamValue(spec);
}

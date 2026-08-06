import { DEFAULT_PARAMS, type GenParams } from '../../gen/genParams';
import { readJson, writeJson } from '../../persistence/localJsonStore';

const STORAGE_KEY = 'procgen.params.v1';

export function loadStoredParams(): GenParams {
  const stored = readJson<Partial<GenParams>>(STORAGE_KEY);
  const params = { ...DEFAULT_PARAMS };
  if (!stored) return params;
  for (const key of Object.keys(params) as (keyof GenParams)[]) {
    const value = stored[key];
    if (typeof value === 'number' && Number.isFinite(value)) params[key] = value;
  }
  return params;
}

export function storeParams(params: GenParams): void {
  writeJson(STORAGE_KEY, params);
}

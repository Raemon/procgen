import type { Feature } from './feature';

export function withoutUnresolvedEdgeKeys(features: Feature[]): Feature[] {
  const keys = new Set(features.map((feature) => feature.key));
  return features.map((feature) => resolvedAgainst(feature, keys));
}

function resolvedAgainst(feature: Feature, keys: ReadonlySet<string>): Feature {
  const parentKey = feature.parentKey && keys.has(feature.parentKey) ? feature.parentKey : null;
  const linkKeys = feature.linkKeys.filter((key) => keys.has(key));
  const untouched = parentKey === feature.parentKey && linkKeys.length === feature.linkKeys.length;
  return untouched ? feature : { ...feature, parentKey, linkKeys };
}

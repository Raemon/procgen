export const RANK_LANDMARK = 0;
export const RANK_NOTABLE = 1;
export const RANK_DETAIL = 2;

export interface FeatureExtent {
  width: number;
  height: number;
}

export interface ExtractedFeature {
  x: number;
  y: number;
  extent: FeatureExtent | null;
  label: string;
  rank: number;
  parentKey: string | null;
  linkKeys: readonly string[];
}

export interface Feature extends ExtractedFeature {
  key: string;
  nodeId: string;
  nodeLabel: string;
  category: string;
}

export function featureKey(nodeId: string, x: number, y: number): string {
  return `${nodeId}@${x},${y}`;
}

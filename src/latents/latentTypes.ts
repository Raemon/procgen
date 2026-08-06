export interface SampledChannels {
  cellsPerSide: number;
  channels: Float32Array[];
  sealedChannelLabels: string[];
}

export interface AxisSummary {
  loadings: number[];
  varianceShare: number;
}

export interface ClusterShape {
  share: number;
  contiguity: number;
  edgeRatio: number;
  touchCounts: number[];
}

export interface NamedCluster {
  name: string;
  evidence: string;
  share: number;
  centroid: number[];
  axisScores: number[];
}

export interface LatentReport {
  cellsPerSide: number;
  assignment: Int32Array;
  clusters: NamedCluster[];
  axes: AxisSummary[];
  sealedChannelLabels: string[];
}

export type InferencePhase = 'sampling' | 'ranking' | 'axes' | 'clustering' | 'shaping';

export interface InferenceProgress {
  phase: InferencePhase;
  done: number;
  total: number;
}

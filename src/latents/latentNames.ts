import { axisScoreOf } from './principalAxes';
import type { AxisSummary, ClusterShape, NamedCluster } from './latentTypes';

const LARGE_SHARE = 0.15;
const CONTIGUOUS = 0.5;
const THIN_EDGE_RATIO = 0.75;
const SPECKLED_CONTIGUITY = 0.3;

export function nameClusters(
  shapes: ClusterShape[],
  centroids: number[][],
  axes: AxisSummary[],
): NamedCluster[] {
  const scores = centroids.map((centroid) => axes.map((axis) => axisScoreOf(centroid, axis)));
  const roles = assignRoles(shapes, scores);
  return shapes.map((shape, k) => ({
    name: roles[k]!,
    evidence: evidenceFor(shape, scores[k]!),
    share: shape.share,
    centroid: centroids[k]!,
    axisScores: scores[k]!,
  }));
}

function assignRoles(shapes: ClusterShape[], scores: number[][]): string[] {
  const roles = new Array<string>(shapes.length).fill('');
  const landmarks = landmarkRoles(shapes, scores);
  for (let k = 0; k < shapes.length; k++) {
    roles[k] = landmarks[k] ?? texturedRole(shapes[k]!, landmarks, shapes) ?? 'mixed ground';
  }
  return dedupedNames(roles);
}

function landmarkRoles(shapes: ClusterShape[], scores: number[][]): (string | undefined)[] {
  const roles = new Array<string | undefined>(shapes.length);
  const bigBodies = shapes
    .map((shape, k) => ({ k, shape }))
    .filter(({ shape }) => shape.share > LARGE_SHARE && shape.contiguity > CONTIGUOUS)
    .sort((a, b) => primaryScoreOf(scores, a.k) - primaryScoreOf(scores, b.k));
  if (bigBodies.length >= 2) {
    roles[bigBodies[0]!.k] = 'deep basin (sea?)';
    roles[bigBodies[bigBodies.length - 1]!.k] = 'high ground (uplands?)';
  }
  const middle = bigBodies.slice(1, -1).sort((a, b) => b.shape.share - a.shape.share);
  if (middle[0]) roles[middle[0].k] = 'open country (plains?)';
  for (const extra of middle.slice(1)) roles[extra.k] = 'broad terrain';
  return roles;
}

function primaryScoreOf(scores: number[][], k: number): number {
  return scores[k]?.[0] ?? 0;
}

function texturedRole(
  shape: ClusterShape,
  landmarks: (string | undefined)[],
  shapes: ClusterShape[],
): string | undefined {
  if (shape.edgeRatio > THIN_EDGE_RATIO && shape.contiguity >= SPECKLED_CONTIGUITY) {
    return borderRole(shape, landmarks, shapes);
  }
  if (shape.contiguity < SPECKLED_CONTIGUITY) return 'scattered patches (spots?)';
  return undefined;
}

function borderRole(
  shape: ClusterShape,
  landmarks: (string | undefined)[],
  shapes: ClusterShape[],
): string {
  const dominantNeighbors = shape.touchCounts
    .map((count, neighbor) => ({ neighbor, count }))
    .filter(({ count }) => count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 2);
  const touchesBasin = dominantNeighbors.some(({ neighbor }) => landmarks[neighbor]?.startsWith('deep basin'));
  const touchesLand = dominantNeighbors.some(({ neighbor }) => sizableLand(landmarks, shapes, neighbor));
  if (touchesBasin && touchesLand) return 'coastline (boundary band?)';
  return 'threads (channels or seams?)';
}

function sizableLand(landmarks: (string | undefined)[], shapes: ClusterShape[], k: number): boolean {
  const role = landmarks[k];
  if (role !== undefined) return !role.startsWith('deep basin');
  return (shapes[k]?.share ?? 0) > LARGE_SHARE;
}

function evidenceFor(shape: ClusterShape, scores: number[]): string {
  const parts = [
    `${Math.round(shape.share * 100)}% of cells`,
    `contiguity ${shape.contiguity.toFixed(2)}`,
    `edge ratio ${shape.edgeRatio.toFixed(2)}`,
    `axis scores ${scores.map((score) => score.toFixed(2)).join(' / ')}`,
  ];
  return parts.join(' · ');
}

function dedupedNames(roles: string[]): string[] {
  const seen = new Map<string, number>();
  return roles.map((role) => {
    const count = (seen.get(role) ?? 0) + 1;
    seen.set(role, count);
    return count === 1 ? role : `${role} ${count}`;
  });
}

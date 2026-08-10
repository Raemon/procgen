import {
  featureKey,
  RANK_DETAIL,
  RANK_LANDMARK,
  RANK_NOTABLE,
  type ExtractedFeature,
} from '../../features/feature';
import {
  registerFeatureExtractor,
  type FeatureExtractionRequest,
} from '../../features/featureExtractorRegistry';
import { chunkExitsOf, type ChunkExits } from '../../labyrinth/chunkExits';
import { ROOM, roleOf } from '../../labyrinth/chunkRole';
import { labyrinthKnobsFrom, type LabyrinthKnobs } from '../../labyrinth/labyrinthKnobs';
import {
  LABYRINTH_CELL_SIZE,
  labyrinthCellCoordOf,
  labyrinthCellOrigin,
} from '../../labyrinth/labyrinthLattice';
import { ringOf } from '../../labyrinth/chunkRing';
import type { WorldRect } from '../../values/pointsInRect';

registerFeatureExtractor('labyrinthChunks', labyrinthChunkFeatures);

function labyrinthChunkFeatures(request: FeatureExtractionRequest): ExtractedFeature[] {
  const knobs = labyrinthKnobsFrom(request.seed, request.node.params);
  return chunksOverlapping(request.rect).map((chunk) =>
    chamberFeature(chunk, knobs, request.node.id),
  );
}

interface ChunkCoord {
  x: number;
  y: number;
}

function chunksOverlapping(rect: WorldRect): ChunkCoord[] {
  const chunks: ChunkCoord[] = [];
  for (let y = labyrinthCellCoordOf(rect.minY); y <= labyrinthCellCoordOf(rect.maxY); y++) {
    for (let x = labyrinthCellCoordOf(rect.minX); x <= labyrinthCellCoordOf(rect.maxX); x++) {
      chunks.push({ x, y });
    }
  }
  return chunks;
}

function chamberFeature(
  chunk: ChunkCoord,
  knobs: LabyrinthKnobs,
  nodeId: string,
): ExtractedFeature {
  const room = roleOf(chunk.x, chunk.y, knobs) === ROOM;
  return {
    x: labyrinthCellOrigin(chunk.x),
    y: labyrinthCellOrigin(chunk.y),
    extent: { width: LABYRINTH_CELL_SIZE, height: LABYRINTH_CELL_SIZE },
    label: chamberLabel(chunk, knobs, room),
    rank: rankOfChamber(chunk, knobs, room),
    parentKey: null,
    linkKeys: neighboursThroughOpenExits(chunk, knobs, nodeId),
  };
}

function chamberLabel(chunk: ChunkCoord, knobs: LabyrinthKnobs, room: boolean): string {
  if (!room) return 'warren';
  const ring = ringOf(chunk.x, chunk.y);
  if (ring === 0) return 'where you wake';
  return ring <= knobs.tutorialRings ? `tutorial chamber, ring ${ring}` : `chamber, ring ${ring}`;
}

function rankOfChamber(chunk: ChunkCoord, knobs: LabyrinthKnobs, room: boolean): number {
  if (!room) return RANK_DETAIL;
  if (ringOf(chunk.x, chunk.y) === 0) return RANK_LANDMARK;
  return ringOf(chunk.x, chunk.y) <= knobs.tutorialRings ? RANK_NOTABLE : RANK_DETAIL;
}

function neighboursThroughOpenExits(
  chunk: ChunkCoord,
  knobs: LabyrinthKnobs,
  nodeId: string,
): string[] {
  const exits = chunkExitsOf(chunk.x, chunk.y, knobs);
  return openSides(exits)
    .map(([dx, dy]) => ({ x: chunk.x + dx, y: chunk.y + dy }))
    .map((neighbour) => featureKey(nodeId, labyrinthCellOrigin(neighbour.x), labyrinthCellOrigin(neighbour.y)));
}

function openSides(exits: ChunkExits): [number, number][] {
  const sides: [number, number][] = [];
  if (exits.west >= 0) sides.push([-1, 0]);
  if (exits.east >= 0) sides.push([1, 0]);
  if (exits.north >= 0) sides.push([0, -1]);
  if (exits.south >= 0) sides.push([0, 1]);
  return sides;
}

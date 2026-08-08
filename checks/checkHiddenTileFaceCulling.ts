import * as THREE from 'three';
import { blankCubeFaceArt, type CubeFaceArt } from '../assets/tiles/tileFaceArt';
import { TRANSPARENT_INK } from '../assets/tiles/inkColor';
import { TileAssets } from '../assets/tiles/tileAssets';
import { PipelineEvaluator } from '../procgen/eval/evaluator';
import { PipelineStore } from '../procgen/pipeline/pipelineStore';
import { sanitizePipeline } from '../procgen/pipeline/sanitizePipeline';
import { examplePipelines } from '../procgen/presets/examplePipelines';
import { WorldSampler } from '../procgen/worldSampler';
import { ChunkOccluderField } from '../world/render/view3d/culling/chunkOccluderField';
import {
  insideChunk,
  placementsAroundChunk,
  type ChunkSurroundings,
} from '../world/render/view3d/culling/chunkSurroundings';
import { foldRareFaceVariants } from '../world/render/view3d/culling/foldRareFaceVariants';
import { occluderFieldOfPlacements } from '../world/render/view3d/culling/occluderFieldOfPlacements';
import { placementSealsFaces } from '../world/render/view3d/culling/placementSealsFaces';
import {
  BOTTOM_FACE,
  EAST_FACE,
  EVERY_FACE,
  NORTH_FACE,
  SOUTH_FACE,
  TOP_FACE,
  WEST_FACE,
  visibleFacesOf,
} from '../world/render/view3d/culling/visibleFaceMask';
import { disposeMeshChildren } from '../world/render/view3d/disposeMeshResources';
import { instancedTileMesh } from '../world/render/view3d/instancedTileMesh';
import { isSharedTileGeometry, sharedTileBoxGeometry } from '../world/render/view3d/sharedTileGeometries';
import { blockShape, ceilingShape, floorShape, voxelShape } from '../world/render/view3d/tileShapes';
import type { TilePlacement } from '../world/render/view3d/tilePlacements';
import { tileBoxGeometry } from '../world/render/view3d/tileBoxGeometry';
import type { CheckReporter } from './checkCharacterBillboardInvariants';

const DELVE_PRESET = 'puzzle labyrinth';
const CUBE = { bottom: 0, top: 1, width: 1 };

export function checkHiddenTileFaceCulling(check: CheckReporter): void {
  checkBuriedGeometryIsNotBuilt(check);
  checkSeeThroughTilesSealNothing(check);
  checkFoldingOnlyEverDrawsMoreFaces(check);
  checkFaceVariantGeometryMatchesTheWholeBox(check);
  checkSharedGeometryOutlivesTheChunk(check);
  checkTheDelveKeepsTheFacesYouCanSee(check);
}

function checkBuriedGeometryIsNotBuilt(check: CheckReporter): void {
  check(
    'a block sealed on all six sides is not built at all',
    visibleFacesOf(fieldSealingEveryNeighbourOf(0, 0), 0, 0, CUBE) === 0,
  );
  check(
    'a block with nothing around it keeps every face',
    visibleFacesOf(emptyField(), 0, 0, CUBE) === EVERY_FACE,
  );
  check(
    'a block resting on its floor slab loses the face the slab covers and no other',
    visibleFacesOf(fieldWith([[0, 0, { bottom: -0.1, top: 0, width: 1 }]]), 0, 0, CUBE) ===
      (EVERY_FACE & ~BOTTOM_FACE),
  );
  check(
    'a neighbour that stops halfway up a face leaves that face standing',
    (visibleFacesOf(fieldWith([[1, 0, { bottom: 0.5, top: 1.5, width: 1 }]]), 0, 0, CUBE) &
      EAST_FACE) !==
      0,
  );
  check(
    'a neighbour narrower than the face it faces leaves that face standing',
    (visibleFacesOf(fieldWith([[1, 0, { bottom: 0, top: 1, width: 0.95 }]]), 0, 0, CUBE) &
      EAST_FACE) !==
      0,
  );
  check(
    'two neighbours stacked one on the other together seal the face they share with it',
    (visibleFacesOf(
      fieldWith([
        [1, 0, { bottom: -0.5, top: 0.5, width: 1 }],
        [1, 0, { bottom: 0.5, top: 1.5, width: 1 }],
      ]),
      0,
      0,
      CUBE,
    ) &
      EAST_FACE) ===
      0,
  );
}

function checkSeeThroughTilesSealNothing(check: CheckReporter): void {
  check(
    'a see-through tile does not seal the face it stands against',
    !placementSealsFaces(placementPainted('#4488ff00', null)),
  );
  check(
    'a tile whose art has a transparent pixel does not seal either',
    !placementSealsFaces(placementPainted('#4488ff', artWithPixel(TRANSPARENT_INK))),
  );
  check(
    'unpainted pixels take the tile colour, so art full of holes still seals',
    placementSealsFaces(placementPainted('#4488ff', blankCubeFaceArt(4))),
  );
  check(
    'a see-through neighbour leaves the face beside it standing',
    (visibleFacesOf(fieldOfPlacementsEastOf(placementPainted('#4488ff00', null)), 0, 0, CUBE) &
      EAST_FACE) !==
      0,
  );
  check(
    'a solid neighbour of the same shape does seal that face',
    (visibleFacesOf(fieldOfPlacementsEastOf(placementPainted('#4488ff', null)), 0, 0, CUBE) &
      EAST_FACE) ===
      0,
  );
}

function checkFoldingOnlyEverDrawsMoreFaces(check: CheckReporter): void {
  const rare = [EAST_FACE, WEST_FACE, SOUTH_FACE, NORTH_FACE].map(faced);
  const common = [...Array(64).keys()].map(() => faced(TOP_FACE));
  const before = [...rare, ...common];
  const folded = foldRareFaceVariants(before);
  check(
    'folding a rare face variant into a shared one never hides a face the culling kept',
    folded.every((one, index) => (one.faces & before[index]!.faces) === before[index]!.faces),
  );
  check(
    'a face variant with plenty of instances keeps its own tight geometry',
    folded.slice(4).every((one) => one.faces === TOP_FACE),
  );
  check(
    'the rare variants end up sharing one geometry rather than one each',
    new Set(folded.slice(0, 4).map((one) => one.faces)).size === 1,
  );
}

function checkFaceVariantGeometryMatchesTheWholeBox(check: CheckReporter): void {
  const faces = EAST_FACE | TOP_FACE;
  const variant = sharedTileBoxGeometry(1, 1, 1, faces);
  const whole = tileBoxGeometry(1, 1, 1);
  check(
    'a face variant draws exactly the faces it keeps',
    variant.getIndex()!.count === 6 * 2 && variant.groups.length === 2,
  );
  check(
    'each kept face still draws with the material its art was painted for',
    variant.groups.every((group) => (faces & (1 << group.materialIndex!)) !== 0),
  );
  check(
    'a kept face is the same corners and art window as it was on the whole box',
    sameCorners(variant, whole),
  );
  check(
    'a box shape is built once and handed to every chunk that needs it',
    sharedTileBoxGeometry(1, 1, 1, faces) === variant &&
      sharedTileBoxGeometry(1, 1, 1, EVERY_FACE) !== variant,
  );
}

function checkSharedGeometryOutlivesTheChunk(check: CheckReporter): void {
  const shared = sharedTileBoxGeometry(1, 0.2, 1, EVERY_FACE);
  check('shared geometry knows itself as shared', isSharedTileGeometry(shared));
  check(
    'disposing a chunk leaves the geometry its neighbours are still drawing with',
    !disposalOf(shared, () => new THREE.Mesh(shared, new THREE.MeshBasicMaterial())),
  );
  check(
    'a chunk still disposes geometry that belongs to it alone',
    disposalOf(new THREE.BoxGeometry(1, 1, 1), (own) => new THREE.Mesh(own, new THREE.MeshBasicMaterial())),
  );
  check(
    'a group with no placements hands its shared geometry back untouched',
    instancedTileMesh(shared, new THREE.MeshBasicMaterial(), [], () => [0, 0, 0]) === null &&
      !disposalOf(shared, () => new THREE.Mesh(shared, new THREE.MeshBasicMaterial())),
  );
}

function checkTheDelveKeepsTheFacesYouCanSee(check: CheckReporter): void {
  const around = delveSurroundings();
  const terrain = occluderFieldOfPlacements(around.window, [
    { placements: around.floors, shape: floorShape() },
    { placements: around.blocks, shape: blockShape() },
    { placements: around.voxels, shape: voxelShape() },
  ]);
  const roof = occluderFieldOfPlacements(around.window, [
    { placements: around.ceilings, shape: ceilingShape() },
  ]);
  check(
    'the delve chunk these claims look at has floors, walls and a roof in it',
    insideChunk(around.floors, 0, 0).length > 0 &&
      insideChunk(around.blocks, 0, 0).length > 0 &&
      insideChunk(around.ceilings, 0, 0).length > 0,
  );
  check(
    'the roof does not seal the wall tops it rests on, because the god camera hides the roof',
    wallTops(around).every(
      (placement) =>
        (visibleFacesOf(terrain, placement.x, placement.y, blockShape().occluderBoxOf!(placement)) &
          TOP_FACE) !==
        0,
    ),
  );
  check(
    'a roof tile with roof all around it keeps its underside and loses its sides',
    facesOfEveryCeiling(around, roof).every((faces) => faces === (TOP_FACE | BOTTOM_FACE)),
  );
  check(
    'the flat floor of the delve draws its top and its underside and nothing else',
    facesOfEveryFloor(around, terrain).every((faces) => faces === (TOP_FACE | BOTTOM_FACE)),
  );
  check(
    'culling drops more than half the faces of the delve floors and walls',
    facesKept(around, terrain) <
      insideChunk([...around.floors, ...around.blocks], 0, 0).length * 6 * 0.5,
  );
}

function facesOfEveryCeiling(around: ChunkSurroundings, roof: ChunkOccluderField): number[] {
  return insideChunk(around.ceilings, 0, 0).map((placement) =>
    visibleFacesOf(roof, placement.x, placement.y, ceilingShape().occluderBoxOf!(placement)),
  );
}

function facesOfEveryFloor(around: ChunkSurroundings, terrain: ChunkOccluderField): number[] {
  return insideChunk(around.floors, 0, 0).map((placement) =>
    visibleFacesOf(terrain, placement.x, placement.y, floorShape().occluderBoxOf!(placement)),
  );
}

function facesKept(around: ChunkSurroundings, terrain: ChunkOccluderField): number {
  return [...facesOfEveryFloor(around, terrain), ...blockFaces(around, terrain)].reduce(
    (total, faces) => total + faceCount(faces),
    0,
  );
}

function blockFaces(around: ChunkSurroundings, terrain: ChunkOccluderField): number[] {
  return insideChunk(around.blocks, 0, 0).map((placement) =>
    visibleFacesOf(terrain, placement.x, placement.y, blockShape().occluderBoxOf!(placement)),
  );
}

function faceCount(faces: number): number {
  return [...Array(6).keys()].filter((bit) => (faces & (1 << bit)) !== 0).length;
}

function wallTops(around: ChunkSurroundings): TilePlacement[] {
  const highest = new Map<string, TilePlacement>();
  for (const placement of around.blocks) {
    const key = `${placement.x},${placement.y}`;
    const known = highest.get(key);
    if (!known || placement.elevation > known.elevation) highest.set(key, placement);
  }
  return [...highest.values()];
}

function delveSurroundings(): ChunkSurroundings {
  const state = sanitizePipeline(
    examplePipelines().find((preset) => preset.name === DELVE_PRESET)!.state,
  );
  const store = new PipelineStore(state);
  const tileAssets = new TileAssets();
  const sampler = new WorldSampler(store, new PipelineEvaluator(store), tileAssets);
  return placementsAroundChunk(sampler, tileAssets, 0, 0);
}

function disposalOf(
  geometry: THREE.BufferGeometry,
  meshOf: (geometry: THREE.BufferGeometry) => THREE.Mesh,
): boolean {
  let disposed = false;
  const listener = () => {
    disposed = true;
  };
  geometry.addEventListener('dispose', listener);
  const group = new THREE.Group();
  group.add(meshOf(geometry));
  disposeMeshChildren(group);
  geometry.removeEventListener('dispose', listener);
  return disposed;
}

function sameCorners(variant: THREE.BufferGeometry, whole: THREE.BufferGeometry): boolean {
  const variantIndex = variant.getIndex()!;
  const wholeIndex = whole.getIndex()!;
  const eastCorners = [...Array(6).keys()].map((corner) => wholeIndex.getX(corner));
  return [...Array(6).keys()].every((corner) => variantIndex.getX(corner) === eastCorners[corner]);
}

function emptyField(): ChunkOccluderField {
  return new ChunkOccluderField(-4, -4, 9);
}

function fieldWith(
  occluders: readonly (readonly [number, number, { bottom: number; top: number; width: number }])[],
): ChunkOccluderField {
  const field = emptyField();
  for (const [x, y, box] of occluders) field.addOccluder(x, y, box);
  return field;
}

function fieldSealingEveryNeighbourOf(x: number, y: number): ChunkOccluderField {
  return fieldWith([
    [x + 1, y, CUBE],
    [x - 1, y, CUBE],
    [x, y + 1, CUBE],
    [x, y - 1, CUBE],
    [x, y, { bottom: 1, top: 2, width: 1 }],
    [x, y, { bottom: -1, top: 0, width: 1 }],
  ]);
}

function fieldOfPlacementsEastOf(neighbour: TilePlacement): ChunkOccluderField {
  return occluderFieldOfPlacements({ originX: -4, originY: -4, span: 9 }, [
    { placements: [neighbour], shape: voxelShape() },
  ]);
}

function placementPainted(baseColor: string, faceArt: CubeFaceArt | null): TilePlacement {
  return {
    x: 1,
    y: 0,
    elevation: 0,
    height: 1,
    baseColor,
    shade: 1,
    faceArt,
    glow: 0,
    sunkenAsWater: false,
  };
}

function artWithPixel(ink: string): CubeFaceArt {
  const art = blankCubeFaceArt(4);
  art.north[0] = ink;
  return art;
}

function faced(faces: number) {
  return { placement: placementPainted('#4488ff', null), faces };
}

import * as THREE from 'three';
import { CreatureAssets } from '../assets/creatures/creatureAssets';
import { ItemAssets } from '../assets/items/itemAssets';
import { TileAssets } from '../assets/tiles/tileAssets';
import { PipelineEvaluator } from '../procgen/eval/evaluator';
import { PipelineStore } from '../procgen/pipeline/pipelineStore';
import { emptyPipeline, type NodeInstance } from '../procgen/pipeline/pipelineState';
import { WorldSampler } from '../procgen/worldSampler';
import { creatureBodyGeometry, creatureBodyMaterials } from '../world/render/view3d/creatureSurfaces';
import { ItemMeshes } from '../world/render/view3d/itemMeshes';
import { itemSurface } from '../world/render/view3d/itemSurfaces';
import { disposeSharedWorldArt } from '../world/render/view3d/sharedWorldArt';
import type { CheckReporter } from './checkCharacterBillboardInvariants';
import { stubTheCanvasTexturesAreRasterizedOnto } from './stubCanvasRasterization';

const SCATTER_DENSITY = 0.15;
const REGION_RADIUS_TILES = 24;

export function checkSharedItemAndCreatureArtInvariants(check: CheckReporter): void {
  stubTheCanvasTexturesAreRasterizedOnto();
  checkEveryCopyOfAnItemDrawsTheSameArt(check);
  checkEveryCopyOfACreatureDrawsTheSameArt(check);
  checkRepeatedGroundItemsCollapseIntoOneMeshEach(check);
  checkDroppingGroundItemsLeavesTheSharedArtAlone(check);
  checkEditingTheArtDropsWhatWasCached(check);
}

function checkEveryCopyOfAnItemDrawsTheSameArt(check: CheckReporter): void {
  disposeSharedWorldArt();
  const items = new ItemAssets();
  const torch = items.byId(5)!;
  const potion = items.byId(0)!;
  check(
    'two ground copies of the same item are handed the same materials, not a fresh rasterization each',
    itemSurface(torch).materials === itemSurface(torch).materials,
  );
  check(
    'two ground copies of the same item share one geometry',
    itemSurface(torch).geometry === itemSurface(torch).geometry,
  );
  check(
    'two different items do not end up wearing each other\'s art',
    itemSurface(torch).materials !== itemSurface(potion).materials,
  );
}

function checkEveryCopyOfACreatureDrawsTheSameArt(check: CheckReporter): void {
  disposeSharedWorldArt();
  const creatures = new CreatureAssets();
  const deer = creatures.byId(0)!;
  const wolf = creatures.byId(2)!;
  check(
    'two cube creatures of the same definition share one material set',
    creatureBodyMaterials(deer) === creatureBodyMaterials(deer),
  );
  check(
    'every cube creature is drawn off the same unit body box',
    creatureBodyGeometry() === creatureBodyGeometry(),
  );
  check(
    'two creature definitions keep their own colours',
    creatureBodyMaterials(deer) !== creatureBodyMaterials(wolf),
  );
}

function checkRepeatedGroundItemsCollapseIntoOneMeshEach(check: CheckReporter): void {
  disposeSharedWorldArt();
  const scattered = scatteredGroundItems([0, 5]);
  const meshes = drawablesOf(scattered.group);
  check(
    'a region scattered with two items draws two meshes, however many copies are on the ground',
    meshes.length === 2,
  );
  check(
    'those meshes are instanced, carrying every copy the region spawned',
    meshes.every((mesh) => mesh instanceof THREE.InstancedMesh) &&
      instancedCopies(meshes) === scattered.spawnCount,
  );
  check(
    'the region really was carrying many copies of each item, or the count above proves nothing',
    scattered.spawnCount > meshes.length * 4,
  );
  scattered.items.dispose();
}

function checkDroppingGroundItemsLeavesTheSharedArtAlone(check: CheckReporter): void {
  disposeSharedWorldArt();
  const scattered = scatteredGroundItems([5]);
  const torchArt = itemSurface(new ItemAssets().byId(5)!);
  const disposals = countedDisposalsOf(torchArt.geometry);
  scattered.items.invalidate();
  check(
    'walking away from a pile of torches does not throw away the art the next pile needs',
    disposals.count === 0,
  );
  disposeSharedWorldArt();
  check(
    'the art is thrown away when the shared caches are dropped, so nothing leaks',
    disposals.count === 1,
  );
  scattered.items.dispose();
}

function checkEditingTheArtDropsWhatWasCached(check: CheckReporter): void {
  disposeSharedWorldArt();
  const items = new ItemAssets();
  const torch = items.byId(5)!;
  const before = itemSurface(torch).materials;
  disposeSharedWorldArt();
  check(
    'repainting an item drops the cached copy, so the world stops drawing the old art',
    itemSurface(torch).materials !== before,
  );
  const creatures = new CreatureAssets();
  const deer = creatures.byId(0)!;
  const beforeBody = creatureBodyMaterials(deer);
  disposeSharedWorldArt();
  check(
    'repainting a creature drops the cached copy too',
    creatureBodyMaterials(deer) !== beforeBody,
  );
}

function scatteredGroundItems(itemIds: readonly number[]) {
  const itemAssets = new ItemAssets();
  const sampler = samplerScattering(itemIds, itemAssets);
  const group = new THREE.Group();
  const items = new ItemMeshes(group, itemAssets, sampler);
  items.syncAround(0, 0, REGION_RADIUS_TILES);
  return { group, items, spawnCount: spawnCountAround(sampler) };
}

function spawnCountAround(sampler: WorldSampler): number {
  const radius = REGION_RADIUS_TILES;
  return sampler.itemSpawnsIn(-radius, -radius, radius, radius).length;
}

function samplerScattering(itemIds: readonly number[], itemAssets: ItemAssets): WorldSampler {
  const store = new PipelineStore({
    ...emptyPipeline(),
    nodes: itemIds.map((itemId) => scatterNode(itemId)),
  });
  return new WorldSampler(
    store,
    new PipelineEvaluator(store),
    new TileAssets(),
    undefined,
    itemAssets,
  );
}

function scatterNode(itemId: number): NodeInstance {
  return {
    id: `scatteredItem${itemId}`,
    type: 'scatterPoints',
    label: `scattered item ${itemId}`,
    comment: '',
    folder: 'checks',
    enabled: true,
    params: { density: SCATTER_DENSITY, maskAtLeast: 0, maskAtMost: 1 },
    inputs: {},
    display: { mode: 'items', itemId },
  };
}

function countedDisposalsOf(resource: THREE.BufferGeometry): { count: number } {
  const disposals = { count: 0 };
  resource.addEventListener('dispose', () => {
    disposals.count++;
  });
  return disposals;
}

function drawablesOf(group: THREE.Object3D): THREE.Mesh[] {
  const meshes: THREE.Mesh[] = [];
  group.traverse((object) => {
    if (object instanceof THREE.Mesh) meshes.push(object);
  });
  return meshes;
}

function instancedCopies(meshes: readonly THREE.Mesh[]): number {
  return meshes.reduce((total, mesh) => total + (mesh as THREE.InstancedMesh).count, 0);
}
